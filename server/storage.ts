import { users, type User, type InsertUser } from "@shared/schema";
import { File } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File system operations
  getFile(name: string): Promise<File | undefined>;
  getAllFiles(): Promise<File[]>;
  createFile(name: string, content: string): Promise<File>;
  updateFile(name: string, content: string): Promise<File | undefined>;
  deleteFile(name: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<string, File>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.currentId = 1;
    
    // Add some default files
    this.initializeDefaultFiles();
  }

  private initializeDefaultFiles() {
    const defaultFiles: [string, string][] = [
      ['index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
    <nav>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>
</body>
</html>`],
      ['styles.css', `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

header {
  background-color: #f5f5f5;
  padding: 1rem;
}

nav ul {
  display: flex;
  list-style: none;
  padding: 0;
}

nav ul li {
  margin-right: 1rem;
}

nav ul li a {
  text-decoration: none;
  color: #333;
}

nav ul li a:hover {
  color: #0066cc;
}`],
      ['script.js', `document.addEventListener('DOMContentLoaded', function() {
  console.log('Document loaded!');
});`]
    ];
    
    defaultFiles.forEach(([name, content]) => {
      this.files.set(name, { name, content });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // File system operations
  async getFile(name: string): Promise<File | undefined> {
    return this.files.get(name);
  }
  
  async getAllFiles(): Promise<File[]> {
    return Array.from(this.files.values());
  }
  
  async createFile(name: string, content: string): Promise<File> {
    const file: File = { name, content };
    this.files.set(name, file);
    return file;
  }
  
  async updateFile(name: string, content: string): Promise<File | undefined> {
    const existingFile = this.files.get(name);
    
    if (!existingFile) {
      return undefined;
    }
    
    const updatedFile: File = { ...existingFile, content };
    this.files.set(name, updatedFile);
    return updatedFile;
  }
  
  async deleteFile(name: string): Promise<boolean> {
    if (!this.files.has(name)) {
      return false;
    }
    
    return this.files.delete(name);
  }
}

export const storage = new MemStorage();
