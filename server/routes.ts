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
      
      if (content === undefined) {
        return res.status(400).json({ error: 'File content is required' });
      }
      
      const file = await storage.updateFile(fileName, content);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.json(file);
    } catch (error) {
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
