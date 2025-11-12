import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { issueService } from '../services/issue.service';

export async function createIssue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const issue = await issueService.create(req.user.id, req.body);
    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
}

export async function getIssues(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      auditId: req.query.auditId as string,
      section: req.query.section as string,
      category: req.query.category as string,
      severity: req.query.severity as string,
      laStatus: req.query.laStatus as string,
      county: req.query.county as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await issueService.list(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getIssueById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const issue = await issueService.getById(req.params.id);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

export async function updateIssue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const issue = await issueService.update(req.params.id, req.user.id, req.body);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

export async function deleteIssue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await issueService.delete(req.params.id, req.user.id);
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function acknowledgeIssue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { response } = req.body;
    const issue = await issueService.acknowledge(req.params.id, req.user.id, response);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

export async function resolveIssue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notes, cost } = req.body;
    const issue = await issueService.resolve(req.params.id, req.user.id, notes, cost);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

export async function verifyIssue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const issue = await issueService.verify(req.params.id, req.user.id);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

