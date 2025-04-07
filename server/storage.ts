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
  <title>VS Code-like HTML Editor</title>
  <link rel="stylesheet" href="styles.css">
  <script src="script.js" defer></script>
</head>
<body>
  <header>
    <div class="container">
      <h1>Welcome to VS Code-like HTML Editor</h1>
      <nav>
        <ul>
          <li><a href="#" class="active">Home</a></li>
          <li><a href="#">Features</a></li>
          <li><a href="#">Documentation</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <h2>Your Complete Web Development Environment</h2>
        <p>This powerful HTML editor provides all the tools you need to build modern websites.</p>
        <button id="learn-more-btn" class="btn">Learn More</button>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <h2>Key Features</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <h3>Monaco Editor</h3>
            <p>Powered by the same editor that drives VS Code, with syntax highlighting and code completion.</p>
          </div>
          <div class="feature-card">
            <h3>Live Preview</h3>
            <p>See your changes instantly with our real-time preview panel.</p>
          </div>
          <div class="feature-card">
            <h3>Responsive Testing</h3>
            <p>Test your design on different screen sizes with our device simulator.</p>
          </div>
          <div class="feature-card">
            <h3>Multi-file Support</h3>
            <p>Work with HTML, CSS, and JavaScript files in a tabbed interface.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="demo">
      <div class="container">
        <h2>Try Different Elements</h2>
        
        <h3>Form Example</h3>
        <form id="demo-form">
          <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" placeholder="Enter your name">
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" rows="4" placeholder="Enter your message"></textarea>
          </div>
          <button type="submit" class="btn">Submit</button>
        </form>

        <h3>Table Example</h3>
        <table id="demo-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Office</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Smith</td>
              <td>Web Developer</td>
              <td>New York</td>
              <td>28</td>
            </tr>
            <tr>
              <td>Jane Doe</td>
              <td>Designer</td>
              <td>London</td>
              <td>32</td>
            </tr>
            <tr>
              <td>Mike Johnson</td>
              <td>Marketing</td>
              <td>San Francisco</td>
              <td>35</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <p>&copy; 2025 VS Code-like HTML Editor. Created with ❤️ by <a href="https://github.com/prakhardoneria" target="_blank">@prakhardoneria</a></p>
      <p>Follow me: <a href="https://instagram.com/prakhardoneria" target="_blank">Instagram</a></p>
    </div>
  </footer>
</body>
</html>`],
      ['styles.css', `/* Base styles */
:root {
  --primary-color: #007acc;
  --secondary-color: #333;
  --light-color: #f5f5f5;
  --dark-color: #252526;
  --text-color: #333;
  --light-text: #fcfcfc;
  --border-color: #ddd;
  --shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--text-color);
  line-height: 1.6;
  background-color: #fff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

a {
  text-decoration: none;
  color: var(--primary-color);
}

/* Header */
header {
  background-color: var(--dark-color);
  color: var(--light-text);
  padding: 1rem 0;
  box-shadow: var(--shadow);
}

header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h1 {
  font-size: 1.5rem;
  margin: 0;
}

nav ul {
  display: flex;
  list-style: none;
}

nav ul li {
  margin-left: 1.5rem;
}

nav ul li a {
  color: var(--light-text);
  transition: color 0.3s;
}

nav ul li a:hover,
nav ul li a.active {
  color: var(--primary-color);
}

/* Hero section */
.hero {
  background: linear-gradient(135deg, var(--primary-color), #0052a2);
  color: var(--light-text);
  padding: 5rem 0;
  text-align: center;
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  max-width: 800px;
  margin: 0 auto 2rem;
}

/* Features section */
.features {
  padding: 5rem 0;
  background-color: var(--light-color);
}

.features h2 {
  text-align: center;
  margin-bottom: 3rem;
  color: var(--secondary-color);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Demo section */
.demo {
  padding: 5rem 0;
}

.demo h2 {
  text-align: center;
  margin-bottom: 3rem;
}

.demo h3 {
  margin: 2rem 0 1rem;
  color: var(--secondary-color);
}

/* Form styles */
form {
  max-width: 600px;
  margin: 2rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

input, textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

/* Table styles */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  box-shadow: var(--shadow);
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

th {
  background-color: var(--primary-color);
  color: var(--light-text);
}

tbody tr:hover {
  background-color: rgba(0, 122, 204, 0.05);
}

/* Button styles */
.btn {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 0.8rem 1.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #005fa3;
}

/* Footer */
footer {
  background-color: var(--dark-color);
  color: var(--light-text);
  padding: 2rem 0;
  text-align: center;
}

footer a {
  color: var(--light-text);
  font-weight: 600;
}

footer a:hover {
  text-decoration: underline;
  color: var(--primary-color);
}

/* Responsive */
@media (max-width: 768px) {
  header .container {
    flex-direction: column;
  }
  
  header h1 {
    margin-bottom: 1rem;
  }
  
  nav ul {
    margin-top: 1rem;
  }
  
  .hero {
    padding: 3rem 0;
  }
  
  .hero h2 {
    font-size: 2rem;
  }
}`],
      ['script.js', `document.addEventListener('DOMContentLoaded', function() {
  console.log('VS Code-like HTML Editor - Document loaded!');
  
  // Add interactive features to the demo page
  
  // 1. Handle the Learn More button click
  const learnMoreBtn = document.getElementById('learn-more-btn');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', function() {
      alert('Welcome to VS Code-like HTML Editor! This editor provides professional web development tools with a familiar interface.');
    });
  }
  
  // 2. Handle form submission (prevent default and show confirmation)
  const demoForm = document.getElementById('demo-form');
  if (demoForm) {
    demoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const messageInput = document.getElementById('message');
      
      // Simple validation
      if (nameInput.value && emailInput.value && messageInput.value) {
        alert('Thank you for your message, ' + nameInput.value + '! This is a demo form - no data is actually sent.');
        demoForm.reset();
      } else {
        alert('Please fill in all fields before submitting.');
      }
    });
  }
  
  // 3. Add hover effects to table rows
  const tableRows = document.querySelectorAll('#demo-table tbody tr');
  tableRows.forEach(row => {
    row.addEventListener('click', function() {
      const name = this.cells[0].innerText;
      const position = this.cells[1].innerText;
      alert('You clicked on ' + name + ', ' + position);
    });
  });
  
  // 4. Add animation to feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'transform 0.3s, box-shadow 0.3s';
      this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.boxShadow = '';
    });
  });
  
  // 5. Add smooth scrolling for navigation
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // In a real application, this would scroll to the section
      alert('Navigation clicked: ' + this.innerText);
    });
  });
  
  console.log('All interactive features initialized!');
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
