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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "all",
    },
    visibilty: {
      type: String,
      enum: ["public", "private"],
    },
    publicLink: {
      type: String,
      trim: "",
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const action = mongoose.model("Links", actionSchema);
export default action;
