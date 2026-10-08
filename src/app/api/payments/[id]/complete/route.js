import { NextResponse } from "next/server";

import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Payment from "@/models/Payment";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import User from "@/models/User";

import { completePromotionPayment } from "@/lib/completePromotionPayment";
export async function POST(request, { params }) {
  let mongoSession = null;

  try {
    // ==========================================
    // ADMIN AUTHENTICATION
    // ==========================================

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // GET PAYMENT ID
    // ==========================================

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment ID is required.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // FIND PAYMENT
    // ==========================================

    const payment =
      await Payment.findById(id);

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    if (payment.method !== "cash") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only cash payments can be confirmed by admin.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // ALREADY PAID
    // ==========================================

    if (payment.status === "paid") {
      return NextResponse.json(
        {
          success: true,
          message:
            "This payment has already been completed.",
          alreadyCompleted: true,
          payment,
        },
        { status: 200 }
      );
    }

    // ==========================================
    // INVALID PAYMENT STATUS
    // ==========================================

    if (
      payment.status === "refunded"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A refunded payment cannot be completed.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // PROMOTION PAYMENT
    // ==========================================

    if (payment.promotion) {
      const result =
        await completePromotionPayment({
          paymentId: payment._id.toString(),
          adminUserId: session.user.id,
        });

      return NextResponse.json(
        {
          success: true,
          message:
            "Promotion cash payment confirmed successfully.",
          ...result,
        },
        { status: 200 }
      );
    }

    // ==========================================
    // NORMAL MEMBERSHIP PAYMENT
    // ==========================================

    if (
      payment.paymentType ===
      "membership"
    ) {
      // ========================================
      // START TRANSACTION
      // ========================================

      mongoSession =
        await mongoose.startSession();

      mongoSession.startTransaction();

      // ========================================
      // GET PAYMENT AGAIN INSIDE TRANSACTION
      // ========================================

      const paymentInTransaction =
        await Payment.findById(
          payment._id
        ).session(mongoSession);

      if (!paymentInTransaction) {
        throw new Error(
          "Payment not found."
        );
      }

      // ========================================
      // DUPLICATE PROTECTION
      // ========================================

      if (
        paymentInTransaction.status ===
        "paid"
      ) {
        await mongoSession.commitTransaction();

        return NextResponse.json(
          {
            success: true,
            message:
              "This payment has already been completed.",
            alreadyCompleted: true,
          },
          { status: 200 }
        );
      }

      // ========================================
      // FIND USER
      // ========================================

      const user =
        await User.findById(
          paymentInTransaction.user
        ).session(mongoSession);

      if (!user) {
        throw new Error(
          "User associated with this payment was not found."
        );
      }

      // ========================================
      // FIND MEMBERSHIP PLAN
      // ========================================

      if (
        !paymentInTransaction.membershipPlan
      ) {
        throw new Error(
          "Membership plan information is missing from this payment."
        );
      }

      const membershipPlan =
        await MembershipPlan.findById(
          paymentInTransaction.membershipPlan
        ).session(mongoSession);

      if (!membershipPlan) {
        throw new Error(
          "Membership plan was not found."
        );
      }

      // ========================================
      // CHECK PLAN ACTIVE
      // ========================================

      if (!membershipPlan.isActive) {
        throw new Error(
          "This membership plan is no longer active."
        );
      }

      // ========================================
      // CHECK EXISTING ACTIVE MEMBERSHIP
      // ========================================

      const now = new Date();

      const activeMembership =
        await Membership.findOne({
          user: user._id,

          status: "active",

          endDate: {
            $gte: now,
          },
        }).session(mongoSession);

      if (activeMembership) {
        throw new Error(
          "This user already has an active membership."
        );
      }

      // ========================================
      // START DATE
      // ========================================

      const startDate =
        paymentInTransaction.membershipStartDate
          ? new Date(
              paymentInTransaction.membershipStartDate
            )
          : new Date();

      if (
        Number.isNaN(
          startDate.getTime()
        )
      ) {
        throw new Error(
          "Invalid membership start date."
        );
      }

      // ========================================
      // END DATE
      // ========================================

      const endDate =
        new Date(startDate);

      endDate.setDate(
        endDate.getDate() +
          membershipPlan.durationInDays
      );

      // ========================================
      // CHECK REGISTRATION FEE
      // ========================================

      const registrationFeeIncluded =
        paymentInTransaction.notes?.includes(
          "₹500 registration fee"
        );

      // ========================================
      // CREATE MEMBERSHIP
      // ========================================

      const membership =
        await Membership.create(
          [
            {
              user: user._id,

              plan:
                membershipPlan._id,

              startDate,

              endDate,

              status: "active",

              priceAtPurchase:
                membershipPlan.price,

              extensions: [],
            },
          ],
          {
            session: mongoSession,
          }
        );

      const createdMembership =
        membership[0];

      // ========================================
      // UPDATE PAYMENT
      // ========================================

      paymentInTransaction.status =
        "paid";

      paymentInTransaction.paidAt =
        new Date();

      paymentInTransaction.membership =
        createdMembership._id;

      paymentInTransaction.recordedBy =
        session.user.id;

      paymentInTransaction.transactionId =
        paymentInTransaction.transactionId ||
        `CASH-${paymentInTransaction._id}`;

      await paymentInTransaction.save({
        session: mongoSession,
      });

      // ========================================
      // UPDATE REGISTRATION FEE
      // ========================================

      if (
        registrationFeeIncluded &&
        !user.registrationFeePaid
      ) {
        user.registrationFeePaid =
          true;

        user.registrationFeePaidAt =
          new Date();

        await user.save({
          session: mongoSession,
        });
      }

      // ========================================
      // COMMIT TRANSACTION
      // ========================================

      await mongoSession.commitTransaction();

      // ========================================
      // RESPONSE
      // ========================================

      return NextResponse.json(
        {
          success: true,

          message:
            "Cash payment confirmed and membership activated successfully.",

          payment: {
            id:
              paymentInTransaction._id,

            amount:
              paymentInTransaction.amount,

            method:
              paymentInTransaction.method,

            status:
              paymentInTransaction.status,

            paidAt:
              paymentInTransaction.paidAt,

            transactionId:
              paymentInTransaction.transactionId,

            membership:
              paymentInTransaction.membership,
          },

          membership: {
            id:
              createdMembership._id,

            planId:
              membershipPlan._id,

            planName:
              membershipPlan.name,

            price:
              membershipPlan.price,

            durationInDays:
              membershipPlan.durationInDays,

            startDate:
              createdMembership.startDate,

            endDate:
              createdMembership.endDate,

            status:
              createdMembership.status,
          },
        },
        { status: 200 }
      );
    }

    // ==========================================
    // OTHER PAYMENT TYPES
    // ==========================================

    return NextResponse.json(
      {
        success: false,
        message:
          "This payment type cannot be completed using this route.",
      },
      { status: 400 }
    );
  } catch (error) {
    // ==========================================
    // ABORT TRANSACTION
    // ==========================================

    if (mongoSession) {
      try {
        await mongoSession.abortTransaction();
      } catch (abortError) {
        console.error(
          "ABORT TRANSACTION ERROR:",
          abortError
        );
      }
    }

    console.error(
      "COMPLETE CASH PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to complete cash payment.",
      },
      { status: 500 }
    );
  } finally {
    // ==========================================
    // END SESSION
    // ==========================================

    if (mongoSession) {
      await mongoSession.endSession();
    }
  }
}