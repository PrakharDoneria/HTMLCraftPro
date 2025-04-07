import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // File API routes
  app.get('/api/files', async (req, res) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve files' });
    }
  });

  app.get('/api/files/:name', async (req, res) => {
    try {
      const fileName = req.params.name;
      const file = await storage.getFile(fileName);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve file' });
    }
  });

  app.post('/api/files', async (req, res) => {
    try {
      const { name, content } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'File name is required' });
      }
      
      const file = await storage.createFile(name, content || '');
      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create file' });
    }
  });

  app.put('/api/files/:name', async (req, res) => {
    try {
      const fileName = req.params.name;
      const { content } = req.body;
      
      console.log(`[Routes] PUT request for file: ${fileName}`);
      
      if (content === undefined) {
        console.error('[Routes] Missing content in request body');
        return res.status(400).json({ error: 'File content is required' });
      }
      
      // Check if file already exists
      let existingFile = await storage.getFile(fileName);
      let file;
      
      if (existingFile) {
        console.log(`[Routes] Updating existing file: ${fileName}`);
        file = await storage.updateFile(fileName, content);
      } else {
        console.log(`[Routes] File not found, creating new file: ${fileName}`);
        file = await storage.createFile(fileName, content);
      }
      
      if (!file) {
        console.error(`[Routes] Failed to save file: ${fileName}`);
        return res.status(500).json({ error: 'Failed to save file' });
      }
      
      console.log(`[Routes] File saved successfully: ${fileName}`);
      res.json(file);
    } catch (error) {
      console.error('[Routes] Error in PUT /api/files/:name:', error);
      res.status(500).json({ error: 'Failed to update file' });
    }
  });

  app.delete('/api/files/:name', async (req, res) => {
    try {
      const fileName = req.params.name;
      const success = await storage.deleteFile(fileName);
      
      if (!success) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
