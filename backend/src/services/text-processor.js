const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const { NlpManager } = require('node-nlp');

// Initialize NLP manager for text processing
const nlpManager = new NlpManager({ languages: ['en'] });

// Extract text from file based on MIME type
const extractTextFromFile = async (filePath, mimeType) => {
  try {
    let text = '';
    
    if (mimeType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (mimeType === 'application/msword') {
      // For older .doc files, you might need additional libraries
      // For now, return empty text
      text = '';
    }
    
    return text;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
};

// Parse resume text and extract structured data
const parseResumeText = async (text) => {
  try {
    const data = {
      personalInfo: {},
      summary: '',
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      projects: []
    };

    if (!text || text.trim().length === 0) {
      return data;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract personal information
    data.personalInfo = extractPersonalInfo(lines);
    
    // Extract skills
    data.skills = extractSkills(text);
    
    // Extract experience
    data.experience = extractExperience(lines);
    
    // Extract education
    data.education = extractEducation(lines);
    
    // Extract certifications
    data.certifications = extractCertifications(lines);
    
    // Extract projects
    data.projects = extractProjects(lines);
    
    // Extract summary
    data.summary = extractSummary(lines);
    
    return data;
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error('Failed to parse resume text');
  }
};

// Extract personal information
const extractPersonalInfo = (lines) => {
  const info = {};
  
  // Look for email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailLine = lines.find(line => emailRegex.test(line));
  if (emailLine) {
    const emailMatch = emailLine.match(emailRegex);
    if (emailMatch) {
      info.email = emailMatch[0];
    }
  }
  
  // Look for phone number
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneLine = lines.find(line => phoneRegex.test(line));
  if (phoneLine) {
    const phoneMatch = phoneLine.match(phoneRegex);
    if (phoneMatch) {
      info.phone = phoneMatch[0];
    }
  }
  
  // Look for location (city, state pattern)
  const locationRegex = /[A-Za-z\s]+,\s*[A-Za-z]{2,}/;
  const locationLine = lines.find(line => locationRegex.test(line));
  if (locationLine) {
    const locationMatch = locationLine.match(locationRegex);
    if (locationMatch) {
      info.location = locationMatch[0];
    }
  }
  
  return info;
};

// Extract skills using keyword matching
const extractSkills = (text) => {
  const skillKeywords = [
    // Programming languages
    'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'typescript',
    // Frameworks
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
    // Cloud platforms
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes',
    // Tools
    'git', 'jenkins', 'jira', 'confluence', 'photoshop', 'illustrator',
    // Skills
    'project management', 'team leadership', 'agile', 'scrum', 'devops'
  ];
  
  const foundSkills = [];
  const textLower = text.toLowerCase();
  
  skillKeywords.forEach(skill => {
    if (textLower.includes(skill)) {
      foundSkills.push(skill);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(foundSkills)];
};

// Extract work experience
const extractExperience = (lines) => {
  const experience = [];
  const experienceKeywords = ['experience', 'work history', 'employment', 'professional experience'];
  
  let inExperienceSection = false;
  let currentJob = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check if we're entering experience section
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      inExperienceSection = true;
      continue;
    }
    
    // Check if we're leaving experience section
    if (inExperienceSection && (line.includes('education') || line.includes('skills') || line.includes('projects'))) {
      inExperienceSection = false;
    }
    
    if (inExperienceSection) {
      // Look for job title patterns
      const datePattern = /\d{4}|\d{1,2}\/\d{4}/;
      if (datePattern.test(lines[i])) {
        // If we have a current job, save it
        if (currentJob) {
          experience.push(currentJob);
        }
        
        // Start new job entry
        currentJob = {
          title: lines[i - 1] || 'Work Experience',
          company: extractCompanyFromLine(lines[i]),
          location: '',
          startDate: extractDateFromLine(lines[i], 'start'),
          endDate: extractDateFromLine(lines[i], 'end'),
          description: '',
          skills: []
        };
      } else if (currentJob && lines[i].length > 10) {
        // Add to description
        currentJob.description += (currentJob.description ? ' ' : '') + lines[i];
      }
    }
  }
  
  // Add the last job if exists
  if (currentJob) {
    experience.push(currentJob);
  }
  
  return experience;
};

// Extract education
const extractEducation = (lines) => {
  const education = [];
  const educationKeywords = ['education', 'academic background', 'qualifications'];
  
  let inEducationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      inEducationSection = true;
      continue;
    }
    
    if (inEducationSection && (line.includes('experience') || line.includes('skills') || line.includes('projects'))) {
      inEducationSection = false;
    }
    
    if (inEducationSection) {
      const degreeKeywords = ['bachelor', 'master', 'phd', 'degree', 'diploma', 'certificate'];
      
      if (degreeKeywords.some(keyword => line.includes(keyword))) {
        const edu = {
          degree: lines[i],
          institution: lines[i + 1] || '',
          location: '',
          startDate: null,
          endDate: null,
          gpa: ''
        };
        
        // Look for dates in next few lines
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const datePattern = /\d{4}/;
          if (datePattern.test(lines[j])) {
            edu.endDate = extractDateFromLine(lines[j], 'end');
            break;
          }
        }
        
        education.push(edu);
      }
    }
  }
  
  return education;
};

// Extract certifications
const extractCertifications = (lines) => {
  const certifications = [];
  const certKeywords = ['certifications', 'certificates', 'licenses'];
  
  let inCertSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (certKeywords.some(keyword => line.includes(keyword))) {
      inCertSection = true;
      continue;
    }
    
    if (inCertSection && (line.includes('experience') || line.includes('education') || line.includes('skills'))) {
      inCertSection = false;
    }
    
    if (inCertSection && lines[i].length > 5) {
      certifications.push({
        name: lines[i],
        issuer: lines[i + 1] && lines[i + 1].length < 50 ? lines[i + 1] : 'Unknown',
        date: extractDateFromLine(lines[i] + ' ' + (lines[i + 1] || ''), 'end'),
        url: ''
      });
    }
  }
  
  return certifications;
};

// Extract projects
const extractProjects = (lines) => {
  const projects = [];
  const projectKeywords = ['projects', 'portfolio', 'personal projects'];
  
  let inProjectSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (projectKeywords.some(keyword => line.includes(keyword))) {
      inProjectSection = true;
      continue;
    }
    
    if (inProjectSection && (line.includes('experience') || line.includes('education') || line.includes('skills'))) {
      inProjectSection = false;
    }
    
    if (inProjectSection && lines[i].length > 5) {
      projects.push({
        name: lines[i],
        description: lines[i + 1] && lines[i + 1].length > 20 ? lines[i + 1] : '',
        technologies: [],
        url: extractUrlFromLine(lines[i] + ' ' + (lines[i + 1] || ''))
      });
    }
  }
  
  return projects;
};

// Extract summary
const extractSummary = (lines) => {
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      // Return the next few lines as summary
      const summaryLines = lines.slice(i + 1, i + 5);
      return summaryLines.join(' ').substring(0, 500);
    }
  }
  
  // If no summary section found, use first few meaningful lines
  const meaningfulLines = lines.filter(line => line.length > 20).slice(0, 3);
  return meaningfulLines.join(' ').substring(0, 500);
};

// Helper function to extract company from line
const extractCompanyFromLine = (line) => {
  // Simple extraction - in real implementation, this would be more sophisticated
  const parts = line.split(/[-|@]/);
  return parts.length > 1 ? parts[1].trim() : 'Unknown Company';
};

// Helper function to extract dates from line
const extractDateFromLine = (line, type = 'start') => {
  const datePattern = /\d{1,2}\/\d{4}|\d{4}/g;
  const matches = line.match(datePattern);
  
  if (!matches) return null;
  
  if (matches.length === 1) {
    return new Date(matches[0]);
  } else if (matches.length === 2) {
    return type === 'start' ? new Date(matches[0]) : new Date(matches[1]);
  }
  
  return new Date(matches[0]);
};

// Helper function to extract URL from line
const extractUrlFromLine = (line) => {
  const urlPattern = /https?:\/\/[^\s]+/;
  const match = line.match(urlPattern);
  return match ? match[0] : '';
};

module.exports = {
  extractTextFromFile,
  parseResumeText
};