import { Request, Response } from 'express';
import { db, httpTemplates, insertHttpTemplateSchema, updateHttpTemplateSchema } from '../database';
import { eq, and, isNull } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'cronx-api', module: 'http-templates' },
});

// Create HTTP Template
export const createHttpTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate request body
    const validatedData = insertHttpTemplateSchema.parse({
      ...req.body,
      userId,
    });

    // Create template
    const [template] = await db
      .insert(httpTemplates)
      .values(validatedData)
      .returning();

    logger.info('HTTP template created', { 
      templateId: template.id, 
      userId,
      name: template.name 
    });

    res.status(201).json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error creating HTTP template:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to create HTTP template',
      timestamp: new Date().toISOString(),
    });
  }
};

// Get all HTTP Templates for user
export const getHttpTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const templates = await db
      .select()
      .from(httpTemplates)
      .where(and(
        eq(httpTemplates.userId, userId),
        isNull(httpTemplates.deletedAt)
      ))
      .orderBy(httpTemplates.createdAt);

    res.json({
      success: true,
      data: templates,
      count: templates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching HTTP templates:', error);
    
    res.status(500).json({
      error: 'Failed to fetch HTTP templates',
      timestamp: new Date().toISOString(),
    });
  }
};

// Get HTTP Template by ID
export const getHttpTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    
    const [template] = await db
      .select()
      .from(httpTemplates)
      .where(and(
        eq(httpTemplates.id, id),
        eq(httpTemplates.userId, userId),
        isNull(httpTemplates.deletedAt)
      ))
      .limit(1);

    if (!template) {
      res.status(404).json({
        error: 'HTTP template not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching HTTP template:', error);
    
    res.status(500).json({
      error: 'Failed to fetch HTTP template',
      timestamp: new Date().toISOString(),
    });
  }
};

// Update HTTP Template
export const updateHttpTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    
    // Validate request body
    const validatedData = updateHttpTemplateSchema.parse(req.body);

    // Check if template exists and belongs to user
    const [existingTemplate] = await db
      .select()
      .from(httpTemplates)
      .where(and(
        eq(httpTemplates.id, id),
        eq(httpTemplates.userId, userId),
        isNull(httpTemplates.deletedAt)
      ))
      .limit(1);

    if (!existingTemplate) {
      res.status(404).json({
        error: 'HTTP template not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Update template
    const [updatedTemplate] = await db
      .update(httpTemplates)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(httpTemplates.id, id))
      .returning();

    logger.info('HTTP template updated', { 
      templateId: id, 
      userId,
      name: updatedTemplate.name 
    });

    res.json({
      success: true,
      data: updatedTemplate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating HTTP template:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to update HTTP template',
      timestamp: new Date().toISOString(),
    });
  }
};

// Delete HTTP Template (soft delete)
export const deleteHttpTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;

    // Check if template exists and belongs to user
    const [existingTemplate] = await db
      .select()
      .from(httpTemplates)
      .where(and(
        eq(httpTemplates.id, id),
        eq(httpTemplates.userId, userId),
        isNull(httpTemplates.deletedAt)
      ))
      .limit(1);

    if (!existingTemplate) {
      res.status(404).json({
        error: 'HTTP template not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Soft delete template
    await db
      .update(httpTemplates)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(httpTemplates.id, id));

    logger.info('HTTP template deleted', { 
      templateId: id, 
      userId,
      name: existingTemplate.name 
    });

    res.json({
      success: true,
      message: 'HTTP template deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting HTTP template:', error);
    
    res.status(500).json({
      error: 'Failed to delete HTTP template',
      timestamp: new Date().toISOString(),
    });
  }
};

// Test HTTP Template
export const testHttpTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;

    // Get template
    const [template] = await db
      .select()
      .from(httpTemplates)
      .where(and(
        eq(httpTemplates.id, id),
        eq(httpTemplates.userId, userId),
        isNull(httpTemplates.deletedAt)
      ))
      .limit(1);

    if (!template) {
      res.status(404).json({
        error: 'HTTP template not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Execute HTTP request
    const axios = await import('axios');
    const startTime = Date.now();

    try {
      // Prepare request config
      const requestConfig: any = {
        method: template.method.toLowerCase(),
        url: template.url,
        headers: template.headers || {},
        timeout: (template.timeoutSeconds || 30) * 1000,
        validateStatus: () => true, // Accept all status codes
        maxRedirects: template.followRedirects ? 5 : 0,
      };

      // Add body for non-GET requests
      if (template.body && !['GET', 'HEAD'].includes(template.method.toUpperCase())) {
        requestConfig.data = template.body;
      }

      // Add authentication
      if (template.authType && template.authConfig) {
        switch (template.authType) {
          case 'bearer':
            requestConfig.headers['Authorization'] = `Bearer ${template.authConfig.token}`;
            break;
          case 'basic':
            requestConfig.auth = {
              username: template.authConfig.username,
              password: template.authConfig.password,
            };
            break;
          case 'api_key':
            if (template.authConfig.location === 'header') {
              requestConfig.headers[template.authConfig.key] = template.authConfig.value;
            } else if (template.authConfig.location === 'query') {
              requestConfig.params = {
                ...requestConfig.params,
                [template.authConfig.key]: template.authConfig.value,
              };
            }
            break;
        }
      }

      const response = await axios.default(requestConfig);
      const executionTime = Date.now() - startTime;

      // Check if status code is expected
      const expectedCodes = template.expectedStatusCodes || [200];
      const isSuccess = expectedCodes.includes(response.status);

      logger.info('HTTP template tested', {
        templateId: id,
        userId,
        status: response.status,
        executionTime,
        success: isSuccess,
      });

      res.json({
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          executionTime,
          isSuccess,
          expectedStatusCodes: expectedCodes,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (httpError: any) {
      const executionTime = Date.now() - startTime;
      
      logger.warn('HTTP template test failed', {
        templateId: id,
        userId,
        error: httpError.message,
        executionTime,
      });

      res.json({
        success: true,
        data: {
          error: httpError.message,
          code: httpError.code,
          executionTime,
          isSuccess: false,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Error testing HTTP template:', error);
    
    res.status(500).json({
      error: 'Failed to test HTTP template',
      timestamp: new Date().toISOString(),
    });
  }
};