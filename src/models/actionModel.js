import mongoose from "mongoose";

const actionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "all",
    },
    visibility: {
      type: Boolean,
      default: false,
    },
    publicLinkToken: {
      type: String,
      trim: "",
      default: "",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    expiresAt:{
      type:Number,
    }
  },
  { timestamps: true }
);

const action = mongoose.model("Links", actionSchema);
export default action;
