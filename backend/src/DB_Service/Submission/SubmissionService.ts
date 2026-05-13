import { ISubmission, Submission } from './SubmissionModel';
import mongoose, { Types } from "mongoose";

const populateSubmission = (query: mongoose.Query<any, any>) => {
    return query
        .populate('studentId')
        .populate('partner')
        .populate('assignmentId');
};

export class SubmissionService {

    async createSubmission(newSubmission: { assignmentId: Types.ObjectId, studentId: string, gitHubLink: string, partner?: string, grade?: Number, feedback?: string }): Promise<ISubmission | null> {
        const submission = await Submission.create(newSubmission);
        const populated = await populateSubmission(
            Submission.findById(submission._id)
        ).exec();
        if (!populated) throw new Error("Could not populate created submission!");
        return populated;
    }

    async getSubmissions(): Promise<ISubmission[] | null> {
        const populated = await populateSubmission(Submission.find()).exec();
        if (!populated) throw new Error("Could not populate getting submission!");
        return populated;
    }

    async getMySubmissions(studentId: string): Promise<ISubmission[] | null> {
        const submissions = await populateSubmission(Submission.find()).exec();
        if (!submissions) throw new Error("Could not populate getting submission!");
        let submissionList = [];
        for (let currentSubmission in submissions) {
            if (submissions[currentSubmission].partner != undefined || submissions[currentSubmission].studentId != undefined) {
                if (submissions[currentSubmission].studentId.equals(studentId) ||
                    (submissions[currentSubmission].partner && submissions[currentSubmission].partner.equals(studentId))) {
                    submissionList.push(submissions[currentSubmission]);
                }
            }
        }

        return submissionList;
    }

    async updateSubmission(studentId: string, assignmentId: string, grade: Number, feedback: string): Promise<ISubmission | null> {
        const submission = await Submission.findOne({ studentId, assignmentId }).exec();
        if (submission) {
            submission.grade = grade;
            submission.feedback = feedback;

            await submission.save();

        }
        return submission;
    }

    async calculateAverages(submissions: any) {
        let assignmentIds: any[] = [];
        let averages: number[] = [];
        for (let i = 0; i < submissions.length; i++) {
            const currentAssignment = submissions[i].assignmentId;
            if (currentAssignment && !assignmentIds.includes(currentAssignment)) {
                assignmentIds.push(currentAssignment)
                let sum = 0;
                let count = 0;
                for (let j = i; j < submissions.length; j++) {
                    if (submissions[j].assignmentId && (submissions[j].assignmentId).equals(currentAssignment)) {
                        if (!isNaN(submissions[j].grade)) {
                            sum += submissions[j].grade;
                            count++;
                        }
                    }
                }
                const average = count > 0 ? sum / count : 0;
                averages.push(average);
            }
        }
        const dicAverages: { [key: string]: number } = {};
        for (let k = 0; k < assignmentIds.length; k++) {
            dicAverages[assignmentIds[k].title] = averages[k];
        }
        return dicAverages;
    }

    classAverageForSubmission(submissions: any, dicAverages: any) {
        let results: { assignment: any, average: number }[] = [];
        for (let i = 0; i < submissions.length; i++) {
            const currentAssignment = submissions[i].assignmentId;
            if (currentAssignment && dicAverages[currentAssignment]) {
                results.push({
                    assignment: submissions[i],
                    average: dicAverages[currentAssignment]
                });
            }
        }
        return results;
    }

}



export const submissionService = new SubmissionService();
