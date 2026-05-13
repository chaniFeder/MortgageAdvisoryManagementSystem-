import { Router, Request, Response} from 'express';
import { authenticateToken } from '../../Middlware/AuthenticationMid';
import { AuthorizedTeacher } from '../../Middlware/AuthorizationMid';
import { AssignmentService } from '../../DB_Service/Assignments/AssignmentsService';
import { RequiredParametersInAssignment } from '../../Middlware/RequiredParametersMid';
import { logger } from "../../Utils/Logger";
import { submissionService } from '../../DB_Service/Submission/SubmissionService';

export const router = Router();

const assignmentService = new AssignmentService();

router.use(authenticateToken);
router.use(AuthorizedTeacher);

router.post('/assignments', RequiredParametersInAssignment, async (req: Request, res: Response) => {
    const newAssignment = req.body;
    try {
       const assignment= await assignmentService.createAssignment(newAssignment);
        logger.debug("assignment was created successfully");
        res.status(201).send(assignment);
    }
    catch (error: any) {
        logger.error(`Failed to create assignment: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});

router.get('/submissions', async (req: Request, res: Response) => {
    try {
        const submissions = await submissionService.getSubmissions();
        if (!submissions || submissions.length === 0) {
            res.status(404).json({ error: 'No submissions found.' });
            return;
        }
        res.status(201).json(submissions);
    } catch (error: any) {
        logger.error(`Failed to get submissions: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});

router.put('/submissions/:studentId/:assignmentId', async (req: Request, res: Response) => {
    try {
        const studentId = req.params.studentId;
        const assignmentId = req.params.assignmentId;
        const { grade, feedback } = req.body;
        const submission = await submissionService.updateSubmission(studentId, assignmentId, grade, feedback);
        if (!submission) {
            res.status(401).json("can't find the submission");
        }
        res.status(201).json(submission);
    } catch (error: any) {
        logger.error(`Failed to update submission: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});

router.get('/stats/averages', async (req: Request, res: Response) => {
    try {
        const submissions = await submissionService.getSubmissions();
        if (!submissions || submissions.length === 0) {
            res.status(404).json({ error: 'No submissions found.' });
            return;
        }
        const averages = await submissionService.calculateAverages(submissions);
        logger.debug("averages were looked up!");
        res.status(201).json(averages);
    } catch (error: any) {
        logger.error(`Failed to calculate averages: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});

