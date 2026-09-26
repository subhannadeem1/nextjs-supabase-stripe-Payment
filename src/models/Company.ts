import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import {
  COMPANY_STATUS_VALUES,
  COMPANY_TYPES,
  CONFIGURATOR_EXISTS,
  PRIORITIES,
  SENIORITY,
} from "@/lib/constants";

const ContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    seniority: { type: String, enum: [...SENIORITY.map((s) => s.value), ""], default: "" },
    decisionMaker: { type: Boolean, default: false },
    linkedin: { type: String, default: "", trim: true },
    linkedinKey: { type: String, default: "" },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

const CompanySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true, index: true },
    letter: { type: String, required: true, index: true },
    website: { type: String, default: "", trim: true },
    domain: { type: String, default: "" },
    country: { type: String, default: "" }, // ISO alpha-2
    city: { type: String, default: "", trim: true },
    type: { type: String, enum: [...COMPANY_TYPES.map((t) => t.value), ""], default: "" },
    segments: { type: [String], default: [] },
    priority: { type: String, enum: [...PRIORITIES.map((p) => p.value), ""], default: "" },
    status: { type: String, enum: COMPANY_STATUS_VALUES, default: "researching", index: true },
    statusChangedAt: { type: Date, default: Date.now },
    closedReason: { type: String, default: "" },
    configurator: {
      exists: {
        type: String,
        enum: CONFIGURATOR_EXISTS.map((c) => c.value),
        default: "unknown",
      },
      url: { type: String, default: "" },
      kind: { type: String, default: "" },
      weaknesses: { type: String, default: "" },
    },
    opportunities: { type: [String], default: [] },
    research: {
      website: { type: Boolean, default: false },
      configurator: { type: Boolean, default: false },
      decisionMaker: { type: Boolean, default: false },
      contactInfo: { type: Boolean, default: false },
    },
    source: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "" },
    contacts: { type: [ContactSchema], default: [] },
    lastContactedAt: { type: Date, default: null },
    followUpAt: { type: Date, default: null, index: true },
    followUpNote: { type: String, default: "" },
  },
  { timestamps: true },
);

// Same website can never be added twice (empty domain is allowed many times).
CompanySchema.index(
  { domain: 1 },
  { unique: true, partialFilterExpression: { domain: { $type: "string", $gt: "" } } },
);
CompanySchema.index({ "contacts.email": 1 });
CompanySchema.index({ "contacts.linkedinKey": 1 });

export type CompanyDoc = InferSchemaType<typeof CompanySchema> & { _id: mongoose.Types.ObjectId };

export const Company: Model<CompanyDoc> =
  (mongoose.models.Company as Model<CompanyDoc>) ||
  mongoose.model<CompanyDoc>("Company", CompanySchema);
