
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

// Extract text from file based on MIME type
const extractTextFromFile = async (filePath, mimeType) => {
  try {
    console.log('Extracting text from file:', filePath, 'type:', mimeType);
    
    let text = '';
    
    if (mimeType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (mimeType === 'application/msword') {
      // For older .doc files, try to read as text
      const buffer = await fs.readFile(filePath);
      text = buffer.toString('utf8');
    } else {
      throw new Error('Unsupported file type');
    }
    
    console.log('Text extraction successful, length:', text.length);
    return text;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
};

// Parse resume text and extract structured data
const parseResumeText = async (text) => {
  try {
    const data = {
      personalInfo: {},
      skills: [],
      experience: [],
      education: []
    };

    if (!text || text.trim().length === 0) {
      return data;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract personal information
    data.personalInfo = extractPersonalInfo(lines);
    
    // Extract skills
    data.skills = extractSkills(text);
    
    // Extract experience (simplified)
    data.experience = extractExperience(lines);
    
    // Extract education (simplified)
    data.education = extractEducation(lines);
    
    return data;
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error(`Failed to parse resume text: ${error.message}`);
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
  
  return info;
};

// Extract skills using keyword matching
const extractSkills = (text) => {
  const skillKeywords = [
    // Programming languages
    'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'typescript',
    // Frameworks
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis',
    // Cloud platforms
    'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    // Tools
    'git', 'jenkins', 'photoshop'
  ];
  
  const foundSkills = [];
  const textLower = text.toLowerCase();
  
  skillKeywords.forEach(skill => {
    if (textLower.includes(skill)) {
      foundSkills.push(skill);
    }
  });
  
  return [...new Set(foundSkills)];
};

// Extract work experience (simplified)
const extractExperience = (lines) => {
  const experience = [];
  
  // Look for common job title keywords
  const jobKeywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'intern'];
  
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    if (jobKeywords.some(keyword => lowerLine.includes(keyword))) {
      // Look for company name in next few lines
      let company = '';
      let duration = '';
      
      for (let i = index + 1; i < Math.min(index + 3, lines.length); i++) {
        if (lines[i].length > 5 && lines[i].length < 50) {
          if (!company && !lines[i].match(/\d{4}/)) {
            company = lines[i];
          }
          if (lines[i].match(/\d{4}/)) {
            duration = lines[i];
            break;
          }
        }
      }
      
      experience.push({
        title: line,
        company: company,
        duration: duration,
        description: `${line} at ${company}`
      });
    }
  });
  
  return experience.slice(0, 5); // Limit to 5 experiences
};

// Extract education (simplified)
const extractEducation = (lines) => {
  const education = [];
  const degreeKeywords = ['bachelor', 'master', 'phd', 'degree', 'diploma', 'university', 'college'];
  
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    if (degreeKeywords.some(keyword => lowerLine.includes(keyword))) {
      let institution = '';
      let year = '';
      
      // Look for institution and year in nearby lines
      for (let i = Math.max(0, index - 1); i < Math.min(index + 3, lines.length); i++) {
        if (i !== index) {
          if (!institution && lines[i].length > 10 && lines[i].length < 100) {
            institution = lines[i];
          }
          const yearMatch = lines[i].match(/\b(19|20)\d{2}\b/);
          if (yearMatch && !year) {
            year = yearMatch[0];
          }
        }
      }
      
      education.push({
        degree: line,
        institution: institution,
        year: year
      });
    }
  });
  
  return education.slice(0, 3); // Limit to 3 education entries
};

module.exports = {
  extractTextFromFile,
  parseResumeText
};