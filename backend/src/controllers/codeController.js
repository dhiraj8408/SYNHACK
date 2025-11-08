import axios from 'axios';

// Piston API endpoint (free, no API key required)
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export const executeCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: 'Language and code are required' });
    }

    // Map our language codes to Piston API language codes
    const languageMap = {
      python: 'python3',
      javascript: 'javascript',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    };

    const pistonLanguage = languageMap[language.toLowerCase()];
    if (!pistonLanguage) {
      return res.status(400).json({ message: `Unsupported language: ${language}` });
    }

    // Prepare the request for Piston API
    const pistonRequest = {
      language: pistonLanguage,
      version: '*', // Use latest version
      files: [
        {
          content: code,
        },
      ],
    };

    // Execute code via Piston API
    const response = await axios.post(PISTON_API_URL, pistonRequest, {
      timeout: 10000, // 10 second timeout
    });

    const result = response.data;

    // Format the response
    const output = result.run.stdout || '';
    const error = result.run.stderr || '';
    const exitCode = result.run.code || 0;

    // Combine output and error
    let combinedOutput = '';
    if (output) {
      combinedOutput += output;
    }
    if (error) {
      combinedOutput += (output ? '\n' : '') + error;
    }
    if (!output && !error && exitCode === 0) {
      combinedOutput = 'Code executed successfully (no output)';
    }

    res.json({
      success: exitCode === 0,
      output: combinedOutput,
      exitCode,
      executionTime: result.run.output ? undefined : undefined, // Piston doesn't provide execution time
    });
  } catch (error) {
    console.error('Code execution error:', error);
    
    if (error.response) {
      // Piston API error
      res.status(500).json({
        success: false,
        output: `Execution Error: ${error.response.data?.message || error.message}`,
        exitCode: 1,
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      res.status(408).json({
        success: false,
        output: 'Execution timeout: Code took too long to execute',
        exitCode: 1,
      });
    } else {
      // Network or other error
      res.status(500).json({
        success: false,
        output: `Server Error: ${error.message}`,
        exitCode: 1,
      });
    }
  }
};

