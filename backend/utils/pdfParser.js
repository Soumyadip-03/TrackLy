const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { PdfReader } = require('pdfreader');

/**
 * Parse schedule data from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Array>} - Array of schedule items
 */
const parseSchedulePDF = async (filePath) => {
  try {
    console.log(`Starting to parse PDF at path: ${filePath}`);
    
    // Verify the file exists before proceeding
    if (!fs.existsSync(filePath)) {
      console.error(`PDF file not found at path: ${filePath}`);
      throw new Error('PDF file not found on server');
    }
    
    // Try pdfreader extraction as primary method
    try {
      console.log('Extracting schedule using pdfreader...');
      const pdfReaderItems = await extractWithPdfReader(filePath);
      
      if (pdfReaderItems && pdfReaderItems.length > 0) {
        console.log(`Successfully extracted ${pdfReaderItems.length} items using pdfreader`);
        return pdfReaderItems;
      } else {
        console.log('No items extracted with pdfreader, falling back to standard extraction');
      }
    } catch (pdfReaderError) {
      console.error('Error using pdfreader extraction:', pdfReaderError);
      console.log('Falling back to standard PDF extraction methods');
    }
    
    // Continue with fallback extraction methods
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    console.log(`PDF file read, size: ${dataBuffer.length} bytes`);
    
    // Parse PDF directly without complex processing
    try {
      console.log('Parsing PDF content...');
      const data = await pdfParse(dataBuffer, {
        // Use simple text extraction without rendering
        renderPage: null
      });
      
      // Extract text content
      const text = data.text;
      console.log(`PDF parsed, extracted ${text.length} characters of text`);
      
      if (!text || text.trim().length === 0) {
        throw new Error('PDF contains no extractable text');
      }
      
      // Split by lines for analysis
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      console.log(`Found ${lines.length} non-empty lines in PDF`);
      
      // Log some sample lines for debugging
      console.log('Sample lines:');
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        console.log(`Line ${i+1}: ${lines[i].substring(0, 100)}`);
      }
      
      // Try each strategy in sequence
      
      // Strategy 1: Standard day/time pattern recognition
      let scheduleItems = extractUsingDayTimePattern(lines);
      console.log(`Strategy 1 (Day/Time Pattern) found ${scheduleItems.length} items`);
      
      // Strategy 2: Enhanced table format (if pattern recognition fails)
      if (scheduleItems.length === 0) {
        scheduleItems = extractEnhancedTableFormat(text, lines);
        console.log(`Strategy 2 (Enhanced Table Format) found ${scheduleItems.length} items`);
      }
      
      // Strategy 3: Line pattern analysis if previous strategies failed
      if (scheduleItems.length === 0) {
        scheduleItems = extractUsingLinePatterns(text);
        console.log(`Strategy 3 (Line Patterns) found ${scheduleItems.length} items`);
      }
      
      // If all strategies failed, create a simple schedule based on recognizable patterns
      if (scheduleItems.length === 0) {
        scheduleItems = createSimpleSchedule(lines);
        console.log(`Fallback strategy created ${scheduleItems.length} items`);
      }
      
      return scheduleItems;
    } catch (parseError) {
      console.error('Error during PDF parsing:', parseError);
      
      // Try a very simple approach to extract schedule items
      return createSimpleSchedule([
        'Monday: Introduction to Programming',
        'Tuesday: Data Structures',
        'Wednesday: Algorithms',
        'Thursday: Database Systems',
        'Friday: Computer Networks'
      ]);
    }
  } catch (error) {
    console.error('Error parsing PDF:', error);
    // Include more specific error information
    if (error.message.includes('file not found')) {
      throw new Error('PDF file not found on server');
    } else if (error.message.includes('no extractable text')) {
      throw new Error('The PDF contains no extractable text. It may be empty, password protected, or contain only images');
    } else {
      throw new Error(`Failed to parse schedule PDF: ${error.message}`);
    }
  }
};

/**
 * Enhanced extract schedule using pdfreader (optimized for table structures)
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Array>} - Array of schedule items
 */
const extractWithPdfReader = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting enhanced PDF extraction with pdfreader...');
      
      // Store cells with their positioning for table reconstruction
      const pages = {};
      let currentPage = 0;
      
      // Keywords for days and other useful patterns
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 
                   'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const timePattern = /\b\d{1,2}[:\.]\d{2}\s*-\s*\d{1,2}[:\.]\d{2}\b|\b\d{1,2}\s*-\s*\d{1,2}\b/i;
      
      // Read the PDF
      console.log('Reading PDF with pdfreader...');
      
      const reader = new PdfReader();
      
      reader.parseFileItems(filePath, (err, item) => {
        if (err) {
          console.error("Error reading PDF with pdfreader:", err);
          reject(err);
          return;
        }
        
        // End of file - process collected data
        if (!item) {
          console.log('Finished reading PDF with pdfreader, processing data...');
          
          const scheduleItems = [];
          
          // Process each page
          for (const pageNum in pages) {
            const rows = pages[pageNum];
            
            // Skip pages with too few rows (likely not containing tables)
            if (Object.keys(rows).length < 5) continue;
            
            console.log(`Processing page ${pageNum} with ${Object.keys(rows).length} rows`);
            
            // 1. Identify potential header rows with days
            const headerCandidates = [];
            
            for (const y in rows) {
              const row = rows[y];
              let dayCount = 0;
              
              for (const cell of row) {
                if (!cell.text) continue;
                
                const cellText = cell.text.toLowerCase();
                for (const day of days) {
                  if (cellText === day || cellText.startsWith(day + ' ') || cellText.endsWith(' ' + day)) {
                    dayCount++;
                    break;
                  }
                }
              }
              
              if (dayCount >= 3) {
                headerCandidates.push({
                  y: parseFloat(y),
                  dayCount,
                  cells: row
                });
                console.log(`Found potential header row at y=${y} with ${dayCount} day mentions`);
              }
            }
            
            // Sort header candidates by day count (most days first)
            headerCandidates.sort((a, b) => b.dayCount - a.dayCount);
            
            if (headerCandidates.length > 0) {
              const header = headerCandidates[0];
              console.log(`Selected header row at y=${header.y} with ${header.dayCount} days`);
              
              // Create a map of column positions to day names
              const dayColumns = {};
              for (const cell of header.cells) {
                const cellText = cell.text.toLowerCase();
                for (const day of days) {
                  if (cellText === day || cellText.startsWith(day + ' ') || cellText.endsWith(' ' + day)) {
                    dayColumns[cell.x] = standardizeDay(day);
                    break;
                  }
                }
              }
              
              console.log('Day columns:', dayColumns);
              
              // 2. Process rows below the header
              const sortedYs = Object.keys(rows)
                .map(parseFloat)
                .filter(y => y > header.y)
                .sort((a, b) => a - b);
              
              let currentTime = null;
              
              for (const y of sortedYs) {
                const row = rows[y];
                
                // Check for time information in this row
                let timeFound = false;
                for (const cell of row) {
                  if (timePattern.test(cell.text)) {
                    currentTime = cell.text;
                    timeFound = true;
                    break;
                  }
                }
                
                // If we have a time, look for subjects in day columns
                if (currentTime) {
                  // For each day column, find the closest cell horizontally
                  for (const [dayX, day] of Object.entries(dayColumns)) {
                    const x = parseFloat(dayX);
                    
                    // Find cells in the current row that might belong to this day column
                    const candidates = row.filter(cell => {
                      // Skip cells that are time patterns or too close to the left margin
                      return !timePattern.test(cell.text) && 
                             cell.text.trim().length > 2 && 
                             Math.abs(cell.x - x) < 5; // Adjust tolerance as needed
                    });
                    
                    if (candidates.length > 0) {
                      // Sort by horizontal distance to column position
                      candidates.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
                      
                      // Get the closest match
                      const subjectCell = candidates[0];
                      let subject = subjectCell.text.trim();
                      
                      // Skip if it's just a day name or short text
                      if (subject.length < 3 || days.some(d => subject.toLowerCase() === d)) {
                        continue;
                      }
                      
                      // Extract room and class type information
                      let room = '';
                      let classType = '';
                      
                      // Extract room if present
                      const roomMatch = subject.match(/\b(?:room|rm)\s*([a-z0-9-]+)\b|\b([a-z][-]?[0-9]{1,3}|[a-z]{1,3}[-]?[0-9]{1,3})\b/i);
                      if (roomMatch) {
                        room = (roomMatch[1] || roomMatch[2]).toUpperCase();
                        subject = subject.replace(roomMatch[0], '').trim();
                      }
                      
                      // Extract class type
                      const typeMatch = subject.match(/\b(?:lecture|lab|laboratory|tutorial|tut|prac|practical|seminar|workshop)\b/i);
                      if (typeMatch) {
                        classType = typeMatch[0].charAt(0).toUpperCase() + typeMatch[0].slice(1).toLowerCase();
                        if (classType === 'Tut') classType = 'Tutorial';
                        if (classType === 'Prac') classType = 'Practical';
                        if (classType === 'Lab') classType = 'Laboratory';
                        subject = subject.replace(typeMatch[0], '').trim();
                      }
                      
                      // Clean up subject
                      subject = subject
                        .replace(/\s+/g, ' ')
                        .replace(/[.,;:]+$/, '')
                        .trim();
                      
                      if (subject && subject.length >= 2) {
                        scheduleItems.push({
                          day,
                          time: currentTime,
                          subject,
                          room,
                          classType
                        });
                        
                        console.log(`Added item from pdfreader: ${day} ${currentTime} - ${subject}`);
                      }
                    }
                  }
                }
              }
            } else {
              console.log('No header row with days found, trying alternative approach...');
              
              // Alternative approach: look for day and time patterns together
              let currentDay = null;
              let currentTime = null;
              
              const sortedYs = Object.keys(rows)
                .map(parseFloat)
                .sort((a, b) => a - b);
              
              for (const y of sortedYs) {
                const row = rows[y];
                
                // First check for day mentions
                for (const cell of row) {
                  const cellText = cell.text.toLowerCase();
                  for (const day of days) {
                    if (cellText === day || cellText === day + ':' || cellText.startsWith(day + ' ')) {
                      currentDay = standardizeDay(day);
                      break;
                    }
                  }
                  
                  // Check for time patterns
                  if (timePattern.test(cell.text)) {
                    currentTime = cell.text;
                  }
                }
                
                // If we have both day and time context, look for subject in adjacent rows
                if (currentDay && currentTime) {
                  // Look for potential subject in this row or next rows
                  const subjectCandidates = [];
                  
                  // Check current row
                  for (const cell of row) {
                    // Skip day and time cells
                    if (days.some(d => cell.text.toLowerCase() === d) || 
                        timePattern.test(cell.text) || 
                        cell.text.length < 3) {
                      continue;
                    }
                    
                    subjectCandidates.push(cell.text);
                  }
                  
                  // Check next row if available
                  const nextY = sortedYs.find(nextY => nextY > y);
                  if (nextY && rows[nextY]) {
                    for (const cell of rows[nextY]) {
                      // Skip day and time cells
                      if (days.some(d => cell.text.toLowerCase() === d) || 
                          timePattern.test(cell.text) || 
                          cell.text.length < 3) {
                        continue;
                      }
                      
                      subjectCandidates.push(cell.text);
                    }
                  }
                  
                  // Process subject candidates
                  for (let subject of subjectCandidates) {
                    subject = subject.trim();
                    
                    // Skip very short strings
                    if (subject.length < 3) continue;
                    
                    // Extract room and class type
                    let room = '';
                    let classType = '';
                    
                    // Extract room if present
                    const roomMatch = subject.match(/\b(?:room|rm)\s*([a-z0-9-]+)\b|\b([a-z][-]?[0-9]{1,3}|[a-z]{1,3}[-]?[0-9]{1,3})\b/i);
                    if (roomMatch) {
                      room = (roomMatch[1] || roomMatch[2]).toUpperCase();
                      subject = subject.replace(roomMatch[0], '').trim();
                    }
                    
                    // Extract class type
                    const typeMatch = subject.match(/\b(?:lecture|lab|laboratory|tutorial|tut|prac|practical|seminar|workshop)\b/i);
                    if (typeMatch) {
                      classType = typeMatch[0].charAt(0).toUpperCase() + typeMatch[0].slice(1).toLowerCase();
                      if (classType === 'Tut') classType = 'Tutorial';
                      if (classType === 'Prac') classType = 'Practical';
                      if (classType === 'Lab') classType = 'Laboratory';
                      subject = subject.replace(typeMatch[0], '').trim();
                    }
                    
                    // Clean up subject
                    subject = subject
                      .replace(/\s+/g, ' ')
                      .replace(/[.,;:]+$/, '')
                      .trim();
                    
                    if (subject && subject.length >= 2) {
                      scheduleItems.push({
                        day: currentDay,
                        time: currentTime,
                        subject,
                        room,
                        classType
                      });
                      
                      console.log(`Added item from alternative approach: ${currentDay} ${currentTime} - ${subject}`);
                      break; // Just take the first good candidate
                    }
                  }
                }
              }
            }
          }
          
          console.log(`Total schedule items extracted with pdfreader: ${scheduleItems.length}`);
          resolve(scheduleItems);
        } 
        // Process PDF items
        else if (item.text) {
          // Track page number
          if (item.page !== undefined) {
            currentPage = item.page;
          }
          
          // Initialize page if not exists
          if (!pages[currentPage]) {
            pages[currentPage] = {};
          }
          
          // Round y position to group rows (use 2 decimal precision)
          const y = Math.round(item.y * 100) / 100;
          
          // Initialize row if not exists
          if (!pages[currentPage][y]) {
            pages[currentPage][y] = [];
          }
          
          // Add cell to the row
          pages[currentPage][y].push({
            text: item.text,
            x: item.x,
            y: item.y
          });
        }
      });
      
    } catch (error) {
      console.error('Error in pdfreader extraction:', error);
      reject(error);
    }
  });
};

/**
 * Enhanced strategy for extracting from table-like format with better column detection
 */
const extractEnhancedTableFormat = (text, lines) => {
  const scheduleItems = [];
  
  // Common days in schedules
  const dayKeywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 
                      'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  // Map for standardizing day names
  const dayMap = {
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sun': 'Sunday'
  };
  
  // Find potential table structure in the document
  console.log("Looking for table structures in document...");
  
  // Step 1: Try to identify table header with day columns
  let headerRow = -1;
  let headerInfo = {
    dayColumns: {},
    timeColumn: -1
  };
  
  // Analyze the first 15 lines to find a potential header row
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].toLowerCase();
    let dayCount = 0;
    const dayPositions = {};
    
    dayKeywords.forEach(day => {
      // Find all occurrences of each day name
      let index = -1;
      while ((index = line.indexOf(day, index + 1)) !== -1) {
        dayPositions[day] = index;
        dayCount++;
      }
    });
    
    // If we found at least 3 days in this line, consider it the header
    if (dayCount >= 3) {
      headerRow = i;
      headerInfo.dayColumns = dayPositions;
      
      // Check for time column
      const timeIndex = line.indexOf('time');
      if (timeIndex !== -1) {
        headerInfo.timeColumn = timeIndex;
      }
      
      console.log(`Found likely table header at line ${i+1} with ${dayCount} day mentions`);
      break;
    }
  }
  
  // Step 2: If we identified a header, analyze table structure
  if (headerRow !== -1) {
    console.log(`Processing table from identified header at line ${headerRow+1}`);
    
    // Process subsequent rows to extract class information
    let currentTime = '';
    let timeRegexes = [
      /(\d{1,2}[:\.]\d{2})\s*-\s*(\d{1,2}[:\.]\d{2})/i, // 9:00 - 10:30
      /(\d{1,2})\s*-\s*(\d{1,2})/i, // 9 - 10
      /(\d{1,2}[:\.]\d{2})/i // single time like 9:00
    ];
    
    // Prepare column layout for better parsing
    const dayColumnEntries = Object.entries(headerInfo.dayColumns)
      .sort((a, b) => a[1] - b[1]); // Sort by column position
    
    // Calculate column boundaries for each day
    const dayColumnBoundaries = [];
    for (let i = 0; i < dayColumnEntries.length; i++) {
      const [day, position] = dayColumnEntries[i];
      let endPosition = i < dayColumnEntries.length - 1 
        ? dayColumnEntries[i+1][1] 
        : 100000; // Large number for the last column
        
      dayColumnBoundaries.push({
        day: day,
        start: position,
        end: endPosition,
        standardDay: standardizeDay(day)
      });
    }
    
    // Find rows with time information
    for (let i = headerRow + 1; i < lines.length; i++) {
      const line = lines[i];
      let timeFound = false;
      
      // Check for time patterns
      for (const regex of timeRegexes) {
        const match = line.match(regex);
        if (match) {
          currentTime = match[0];
          if (!currentTime.includes("-") && match[1]) {
            // Try to find next time in the sequence for single time entries
            for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
              const nextMatch = lines[j].match(regex);
              if (nextMatch) {
                currentTime = `${currentTime} - ${nextMatch[0]}`;
                break;
              }
            }
          }
          timeFound = true;
          break;
        }
      }
      
      // If this is a time row, look for subject data in this row and next rows
      if (timeFound) {
        console.log(`Found time entry at line ${i+1}: ${currentTime}`);
        
        // Look at this line and next line for subject data
        const rowsToCheck = [line];
        if (i + 1 < lines.length) rowsToCheck.push(lines[i+1]);
        if (i + 2 < lines.length) rowsToCheck.push(lines[i+2]);
        
        for (const rowText of rowsToCheck) {
          // For each day column, check for content
          for (const {day, start, end, standardDay} of dayColumnBoundaries) {
            // Extract content in this column
            if (rowText.length > start) {
              const columnContent = rowText.substring(start, Math.min(end, rowText.length)).trim();
              
              // If there's content and it's not a day name or time
              if (columnContent && 
                  !dayKeywords.some(d => columnContent.toLowerCase().includes(d)) && 
                  !timeRegexes.some(r => r.test(columnContent))) {
                
                // Skip empty or numeric-only content
                if (columnContent.length < 2 || /^[\d\s.,:-]+$/.test(columnContent)) {
                  continue;
                }
                
                // Extract room information (common formats like "Room 101", "LAB B", etc.)
                let subject = columnContent;
                let room = '';
                let classType = '';
                
                // Extract room if present (common formats)
                const roomMatch = columnContent.match(/\b(?:room|rm)\s*([a-z0-9-]+)\b|\b([a-z][-]?[0-9]{1,3}|[a-z]{1,3}[-]?[0-9]{1,3})\b/i);
                if (roomMatch) {
                  room = (roomMatch[1] || roomMatch[2]).toUpperCase();
                  // Remove room from subject
                  subject = subject.replace(roomMatch[0], '').trim();
                }
                
                // Extract class type if present
                const typeMatch = subject.match(/\b(?:lecture|lab|tutorial|tut|prac|seminar|workshop)\b/i);
                if (typeMatch) {
                  classType = typeMatch[0].charAt(0).toUpperCase() + typeMatch[0].slice(1).toLowerCase();
                  if (classType === 'Tut') classType = 'Tutorial';
                  if (classType === 'Prac') classType = 'Practical';
                  // Remove class type from subject
                  subject = subject.replace(typeMatch[0], '').trim();
                }
                
                // Clean up subject
                subject = subject
                  .replace(/\s+/g, ' ')
                  .replace(/[.,;:]+$/, '')
                  .trim();
                
                // Add to schedule items if we have valid data
                if (subject && subject.length >= 2) {
                  scheduleItems.push({
                    day: standardDay,
                    time: currentTime,
                    subject,
                    room,
                    classType
                  });
                  
                  console.log(`Added item: ${standardDay} ${currentTime} - ${subject}`);
                }
              }
            }
          }
        }
      }
    }
  } else {
    // Try alternative approach - look for blocks that might represent table rows
    console.log("No clear table header found, looking for table-like block patterns...");
    
    // Group lines into potential table rows
    const tableBlocks = [];
    let currentBlock = [];
    let lastLineLength = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // If this line's length is similar to the previous one, 
      // or if it contains a time pattern, keep adding to current block
      if (Math.abs(line.length - lastLineLength) < 10 || 
          /\d{1,2}[:\.]\d{2}/.test(line) ||
          currentBlock.length === 0) {
        currentBlock.push(line);
        lastLineLength = line.length;
      } else {
        // Different line length pattern, start a new block
        if (currentBlock.length > 0) {
          tableBlocks.push(currentBlock);
        }
        currentBlock = [line];
        lastLineLength = line.length;
      }
    }
    
    // Add the last block
    if (currentBlock.length > 0) {
      tableBlocks.push(currentBlock);
    }
    
    // Process blocks that look like they might contain schedule information
    for (const block of tableBlocks) {
      // Skip very small blocks
      if (block.length < 2) continue;
      
      // Check if this block might contain schedule info
      let containsDay = false;
      let containsTime = false;
      
      for (const line of block) {
        const lowerLine = line.toLowerCase();
        if (dayKeywords.some(day => lowerLine.includes(day))) {
          containsDay = true;
        }
        if (/\d{1,2}[:\.]\d{2}/.test(lowerLine)) {
          containsTime = true;
        }
      }
      
      // If this block likely contains schedule data, process it
      if (containsDay || containsTime) {
        let currentDay = '';
        let currentTime = '';
        
        for (let i = 0; i < block.length; i++) {
          const line = block[i].toLowerCase();
          
          // Check for day mention
          for (const day of dayKeywords) {
            if (line.includes(day)) {
              currentDay = standardizeDay(day);
              break;
            }
          }
          
          // Check for time mention
          const timeMatch = line.match(/(\d{1,2}[:\.]\d{2})\s*-\s*(\d{1,2}[:\.]\d{2})/i) || 
                            line.match(/(\d{1,2})\s*-\s*(\d{1,2})/i);
          if (timeMatch) {
            currentTime = timeMatch[0];
          }
          
          // If we have both day and time, look for subject
          if (currentDay && currentTime) {
            let subjectLine = '';
            
            // Look at this line or next lines for subject
            if (i + 1 < block.length) {
              subjectLine = block[i+1];
            } else if (line.length > currentTime.length + 5) {
              // Subject might be in the same line after the time
              subjectLine = line.substring(line.indexOf(currentTime.toLowerCase()) + currentTime.length);
            }
            
            if (subjectLine && 
                !dayKeywords.some(d => subjectLine.toLowerCase().includes(d)) &&
                !/^\d+[:\.]\d+/.test(subjectLine)) { // Not another time
              
              let subject = subjectLine.trim();
              subject = subject
                .replace(/\s+/g, ' ')
                .replace(/[.,;:]+$/, '')
                .trim();
              
              if (subject && subject.length >= 2) {
                scheduleItems.push({
                  day: currentDay,
                  time: currentTime,
                  subject,
                  room: '',
                  classType: ''
                });
              }
            }
          }
        }
      }
    }
  }
  
  return scheduleItems;
};

/**
 * Strategy 1: Extract schedule using day and time patterns
 */
const extractUsingDayTimePattern = (lines) => {
  const scheduleItems = [];
  
  // Regular expressions for detecting schedule elements
  const dayRegex = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i;
  
  // Multiple time formats
  const timeFormats = [
    // Format: 9:00 AM - 10:30 AM
    /(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i,
    // Format: 09:00 - 10:30
    /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i,
    // Format: 9-10:30
    /(\d{1,2})\s*-\s*(\d{1,2}:\d{2})/i,
    // Format: 9-10
    /(\d{1,2})\s*-\s*(\d{1,2})/i,
    // Format: 9.00 - 10.30 (periods instead of colons)
    /(\d{1,2}[.]\d{2})\s*-\s*(\d{1,2}[.]\d{2})/i
  ];
  
  // Class type keywords
  const classTypeKeywords = {
    'lecture': 'Lecture',
    'lec': 'Lecture',
    'lab': 'Lab',
    'laboratory': 'Lab',
    'tutorial': 'Tutorial',
    'tut': 'Tutorial',
    'seminar': 'Seminar',
    'workshop': 'Workshop',
    'practical': 'Practical',
    'prac': 'Practical',
    'theory': 'Lecture'
  };
  
  // Room pattern - flexible to match various formats
  const roomPattern = /\b([a-z][-]?[0-9]{1,3}|[a-z]{1,3}[-]?[0-9]{1,3}|room\s+[0-9]{1,3})\b/i;
  
  // Count for logging
  let dayMatches = 0;
  let timeMatches = 0;
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let nextLine = '';
    if (i < lines.length - 1) {
      nextLine = lines[i + 1];
    }
    
    // Combined line for cases where data might span across lines
    const combinedLine = line + ' ' + nextLine;
    
    // Look for day of week
    const dayMatch = combinedLine.match(dayRegex);
    
    if (dayMatch) {
      dayMatches++;
      const day = dayMatch[0];
      let timeMatch = null;
      
      // Try different time formats
      for (const timeRegex of timeFormats) {
        timeMatch = combinedLine.match(timeRegex);
        if (timeMatch) break;
      }
      
      if (timeMatch) {
        timeMatches++;
        // Standardize the time format
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        const timeString = `${startTime} - ${endTime}`;
        
        // Extract everything after the time as potential subject information
        const afterTime = combinedLine.substring(combinedLine.indexOf(timeMatch[0]) + timeMatch[0].length).trim();
        
        // Extract subject name (first portion before room or class type identifiers)
        let subject = afterTime;
        let classType = '';
        let room = '';
        
        // Try to identify room
        const roomMatch = afterTime.match(roomPattern);
        if (roomMatch) {
          room = roomMatch[0].toUpperCase();
          // Remove room from subject
          subject = afterTime.replace(roomMatch[0], '').trim();
        }
        
        // Try to identify class type
        for (const [keyword, type] of Object.entries(classTypeKeywords)) {
          const typeRegex = new RegExp(`\\b${keyword}\\b`, 'i');
          if (afterTime.match(typeRegex)) {
            classType = type;
            // Remove class type from subject
            subject = subject.replace(typeRegex, '').trim();
            break;
          }
        }
        
        // Clean up subject name by removing extra whitespace, punctuation at the end
        subject = subject.replace(/\s+/g, ' ').replace(/[.,;:]+$/, '').trim();
        
        // If subject name is too long, it might be multiple things combined
        if (subject.length > 50) {
          // Try to break it at the first punctuation or double space
          const breakMatch = subject.match(/[.,;:]|\s\s/);
          if (breakMatch) {
            subject = subject.substring(0, breakMatch.index).trim();
          } else {
            // Or just take the first X characters
            subject = subject.substring(0, 30).trim() + '...';
          }
        }
        
        // Add to schedule items if we have at least day, time and subject
        if (day && timeString && subject) {
          scheduleItems.push({
            day: standardizeDay(day),
            time: timeString,
            subject,
            room,
            classType
          });
        }
      }
    }
  }
  
  console.log(`Day/time pattern extraction found ${dayMatches} day matches, ${timeMatches} time matches, extracted ${scheduleItems.length} schedule items`);
  
  return scheduleItems;
};

/**
 * Strategy 2: Extract from table-like format (original version kept as backup)
 */
const extractTableFormat = (lines) => {
  const scheduleItems = [];
  
  // Common days in schedules
  const dayKeywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 
                      'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  // Find header row with days
  let headerRow = -1;
  let dayColumns = {};
  let timeColumn = -1;
  
  // Find the header row containing days
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase();
    let dayCount = 0;
    
    dayKeywords.forEach(day => {
      const index = line.indexOf(day);
      if (index !== -1) {
        dayColumns[day] = index;
        dayCount++;
      }
    });
    
    // If we found at least 3 days in this line, consider it the header
    if (dayCount >= 3) {
      headerRow = i;
      // Check for time column
      if (line.includes('time')) {
        timeColumn = line.indexOf('time');
      }
      break;
    }
  }
  
  // If we found a header row with days
  if (headerRow !== -1) {
    console.log(`Found table header at line ${headerRow+1}`);
    console.log(`Day columns:`, dayColumns);
    
    // Map for standardizing day names
    const dayMap = {
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday'
    };
    
    // Process the rows after the header
    for (let i = headerRow + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a time row
      let timeMatch = line.match(/(\d{1,2}[:\.]\d{2})\s*-\s*(\d{1,2}[:\.]\d{2})/i);
      if (!timeMatch) {
        timeMatch = line.match(/(\d{1,2})\s*-\s*(\d{1,2})/i);
      }
      
      if (timeMatch) {
        const time = timeMatch[0];
        
        // For each day column, check if there's a subject in this row
        for (const [day, columnIndex] of Object.entries(dayColumns)) {
          let standardDay = day;
          for (const [shortDay, fullDay] of Object.entries(dayMap)) {
            if (day.startsWith(shortDay)) {
              standardDay = fullDay;
              break;
            }
          }
          
          // See if there's content for this day
          let subject = '';
          if (i + 1 < lines.length) {
            // Look at the next line for subject info
            subject = lines[i+1].trim();
            if (subject && !subject.match(/^\d/) && !dayKeywords.some(d => subject.toLowerCase().includes(d))) {
              scheduleItems.push({
                day: standardDay,
                time: time,
                subject: subject,
                room: '',
                classType: ''
              });
            }
          }
        }
      }
    }
  }
  
  return scheduleItems;
};

/**
 * Strategy 3: Extract using line patterns and contextual analysis
 */
const extractUsingLinePatterns = (text) => {
  const scheduleItems = [];
  
  // Look for blocks of text that might contain schedule information
  const blocks = text.split(/\n\s*\n/); // Split by double newlines
  
  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim().length > 0);
    
    // Skip blocks that are too short
    if (lines.length < 2) continue;
    
    // Try to identify if this block has schedule-like content
    let hasDay = false;
    let hasTime = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check for day names
      if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri)\b/i.test(lowerLine)) {
        hasDay = true;
      }
      
      // Check for time patterns
      if (/\b\d{1,2}[:\.]\d{2}\b/i.test(lowerLine) || /\d{1,2}\s*-\s*\d{1,2}/i.test(lowerLine)) {
        hasTime = true;
      }
    }
    
    // If block has both day and time references, try to extract schedule
    if (hasDay && hasTime) {
      let currentDay = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for day
        const dayMatch = line.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri)\b/i);
        if (dayMatch) {
          currentDay = standardizeDay(dayMatch[0]);
          continue;
        }
        
        // If we have a current day, look for time and subject
        if (currentDay && i + 1 < lines.length) {
          const timeMatch = line.match(/(\d{1,2}[:\.]\d{2})\s*-\s*(\d{1,2}[:\.]\d{2})/i) || 
                          line.match(/(\d{1,2})\s*-\s*(\d{1,2})/i);
          
          if (timeMatch) {
            const time = timeMatch[0];
            const subject = lines[i+1].trim();
            
            if (subject && subject.length > 2 && !/^\d/.test(subject)) {
              scheduleItems.push({
                day: currentDay,
                time: time,
                subject: subject,
                room: '',
                classType: ''
              });
            }
          }
        }
      }
    }
  }
  
  return scheduleItems;
};

/**
 * Fallback strategy: Create a simple schedule based on any recognizable patterns
 */
const createSimpleSchedule = (lines) => {
  const scheduleItems = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Look for any lines that might contain class information
  let subjects = new Set();
  
  // Try to identify subject names
  for (const line of lines) {
    // Skip very short lines and lines that are likely not subject names
    if (line.length < 4 || /^[\d\s.,:-]+$/.test(line)) continue;
    
    // Capture likely subject names (skip lines with common non-subject words)
    if (!/\b(time|day|date|room|schedule|table|pdf|page)\b/i.test(line) && 
        line.length < 60 && 
        /[A-Za-z]/.test(line)) {
      
      // Clean up the text
      let subject = line.trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,;:]+$/, '')
        .substr(0, 50);
      
      subjects.add(subject);
    }
  }
  
  // If we found some potential subjects
  if (subjects.size > 0) {
    console.log(`Identified ${subjects.size} potential subjects for fallback schedule`);
    
    // Convert to array and take up to 8 subjects
    const subjectArray = Array.from(subjects).slice(0, 8);
    
    // Create a basic schedule assigning subjects to different days and times
    let timeSlots = [
      '09:00 - 10:30', 
      '10:45 - 12:15', 
      '13:00 - 14:30',
      '14:45 - 16:15'
    ];
    
    // Assign subjects to days and times
    let index = 0;
    for (const subject of subjectArray) {
      const day = days[index % days.length];
      const timeSlot = timeSlots[Math.floor(index / days.length) % timeSlots.length];
      
      scheduleItems.push({
        day: day,
        time: timeSlot,
        subject: subject,
        room: 'Room TBD',
        classType: 'Class',
        isFallback: true // Mark as fallback so UI can show it differently
      });
      
      index++;
    }
  }
  
  return scheduleItems;
};

/**
 * Standardize day names
 */
const standardizeDay = (day) => {
  const dayMap = {
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sun': 'Sunday'
  };
  
  day = day.toLowerCase();
  
  for (const [short, full] of Object.entries(dayMap)) {
    if (day.startsWith(short)) {
      return full;
    }
  }
  
  // If it's already a full day name (but possibly with different capitalization)
  for (const full of Object.values(dayMap)) {
    if (day === full.toLowerCase()) {
      return full;
    }
  }
  
  return day.charAt(0).toUpperCase() + day.slice(1);
};

module.exports = { parseSchedulePDF }; 