import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      },
      email: {
        type: String,
        required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", UserSchema);
export default userModel;
