import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubmission extends Document {
    assignmentId: Types.ObjectId;
    studentId: string;
    gitHubLink: string;
    partner: string;
    grade: Number;
    feedback: string;
    isGraded?: boolean;
}

const submissionSchema = new Schema<ISubmission>(
    {
        assignmentId: { type: Schema.Types.ObjectId, required: true, ref: 'assignment' },
        studentId: { type: String, required: true, ref: 'User' },
        gitHubLink: { type: String, required: true },
        partner: { type: String, ref: 'User' },
        grade: { type: Number },
        feedback: { type: String, minlength: 2, maxLength: 100 }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true, },
        toObject: { virtuals: true }
    }
);

submissionSchema.virtual('isGraded').get(function () {
    if (this.grade != undefined || this.grade != null)
        return true;
    return false;
}
);

export const Submission = mongoose.model<ISubmission>('submission', submissionSchema);
