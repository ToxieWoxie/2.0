import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "editor", "viewer"], required: true }
  },
  { _id: false }
);

const InviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, index: true },
    role: { type: String, enum: ["editor", "viewer"], required: true },
    expiresAt: { type: Date, required: true }
  },
  { _id: false }
);


const QuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["multiple_choice", "short_answer", "long_answer", "color_wheel"], required: true },
    prompt: { type: String, default: "" },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    includeAssessment: { type: Boolean, default: false },
    recordUserEnabled: { type: Boolean, default: false },
    questions: { type: [QuestionSchema], default: [] },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [MemberSchema], default: [] },
    viewerCode: { type: String, default: "", index: true },
    invites: { type: [InviteSchema], default: [] }
  },
  { timestamps: true }
);

ProjectSchema.methods.roleFor = function roleFor(userId) {
  const found = this.members.find((m) => String(m.user) === String(userId));
  return found?.role || null;
};

export const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
