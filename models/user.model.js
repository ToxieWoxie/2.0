// FILE: server/models/user.model.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, trim: true },
    usernameLower: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);

/**
 * Promise-style middleware (no `next`).
 * Mixing `async` + `next()` causes "next is not a function".
 */
UserSchema.pre("validate", function preValidate() {
  if (this.username) {
    this.username = String(this.username).trim();
    this.usernameLower = String(this.username).toLowerCase();
  }
});

UserSchema.methods.toAuthJSON = function toAuthJSON() {
  return {
    id: String(this._id),
    email: this.email,
    username: this.username,
    avatarUrl: this.avatarUrl || null,
    bio: this.bio || null,
  };
};

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
