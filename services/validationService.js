const GeneratedContent = require('../models/GeneratedContent');
const ValidationResult = require('../models/ValidationResult');
const { getOpenAI } = require('./clients/openaiClient');
const { semanticSearch } = require('./searchService');

// Main validation function - runs all applicable validators
async function validateContent(contentId) {
  const content = await GeneratedContent.findById(contentId);
  if (!content) {
    throw new Error('Content not found');
  }

  const results = [];

  // 1. Syntax validation (for code content)
  if (content.type === 'lab' && content.programmingLanguage) {
    const syntaxResult = await validateSyntax(content);
    results.push(syntaxResult);
    await saveValidationResult(contentId, 'syntax', syntaxResult);
  }

  // 2. Grounding check (verify content is grounded in sources)
  const groundingResult = await validateGrounding(content);
  results.push(groundingResult);
  await saveValidationResult(contentId, 'grounding', groundingResult);

  // 3. Rubric-based evaluation
  const rubricResult = await evaluateWithRubric(content);
  results.push(rubricResult);
  await saveValidationResult(contentId, 'rubric', rubricResult);

  // 4. AI self-evaluation with explainability
  const aiResult = await aiSelfEvaluation(content);
  results.push(aiResult);
  await saveValidationResult(contentId, 'ai_evaluation', aiResult);

  // Calculate overall status
  const overallStatus = calculateOverallStatus(results);
  
  // Update content validation status
  await GeneratedContent.findByIdAndUpdate(contentId, {
    validationStatus: overallStatus === 'pass' ? 'validated' : 'failed'
  });

  return {
    contentId,
    overallStatus,
    results
  };
}

// Syntax validation for code
async function validateSyntax(content) {
  const code = extractCodeBlocks(content.content);
  const language = content.programmingLanguage?.toLowerCase();
  const errors = [];

  if (!code || code.length === 0) {
    return {
      type: 'syntax',
      status: 'warning',
      score: 50,
      details: 'No code blocks found in content',
      errors: []
    };
  }

  for (const block of code) {
    const blockErrors = validateCodeSyntax(block, language);
    errors.push(...blockErrors);
  }

  if (errors.length === 0) {
    return {
      type: 'syntax',
      status: 'pass',
      score: 100,
      details: 'All code blocks pass syntax validation',
      errors: []
    };
  } else if (errors.length <= 2) {
    return {
      type: 'syntax',
      status: 'warning',
      score: 70,
      details: `Found ${errors.length} potential syntax issue(s)`,
      errors
    };
  } else {
    return {
      type: 'syntax',
      status: 'fail',
      score: 30,
      details: `Found ${errors.length} syntax errors`,
      errors
    };
  }
}

// Extract code blocks from markdown content
function extractCodeBlocks(content) {
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }
  
  return blocks;
}

// Basic syntax validation patterns
function validateCodeSyntax(code, language) {
  const errors = [];
  
  // Common syntax checks
  const checks = {
    python: [
      { pattern: /^\s*def\s+\w+\s*\([^)]*\)\s*[^:]/m, message: 'Missing colon after function definition' },
      { pattern: /^\s*if\s+[^:]+[^:]\s*$/m, message: 'Missing colon after if statement' },
      { pattern: /^\s*for\s+[^:]+[^:]\s*$/m, message: 'Missing colon after for loop' },
      { pattern: /^\s*while\s+[^:]+[^:]\s*$/m, message: 'Missing colon after while loop' },
      { pattern: /^\s*class\s+\w+[^:]*[^:]\s*$/m, message: 'Missing colon after class definition' }
    ],
    javascript: [
      { pattern: /function\s+\w+\s*\([^)]*\)\s*[^{]/m, message: 'Missing opening brace after function' },
      { pattern: /if\s*\([^)]+\)\s*[^{]/m, message: 'Missing opening brace after if statement' },
      { pattern: /\bconst\s+\w+\s*[^=;]/m, message: 'Const declaration without assignment' }
    ],
    typescript: [
      { pattern: /function\s+\w+\s*\([^)]*\)\s*[^:{]/m, message: 'Missing opening brace or type after function' },
      { pattern: /\bconst\s+\w+\s*[^=:;]/m, message: 'Const declaration without assignment or type' }
    ],
    java: [
      { pattern: /class\s+\w+[^{]*[^{]\s*$/m, message: 'Missing opening brace after class' },
      { pattern: /public\s+\w+\s+\w+\s*\([^)]*\)\s*[^{]/m, message: 'Missing opening brace after method' }
    ],
    cpp: [
      { pattern: /#include\s+[^<"][^>\n]*/m, message: 'Invalid include statement' },
      { pattern: /int\s+main\s*\([^)]*\)\s*[^{]/m, message: 'Missing opening brace after main' }
    ],
    c: [
      { pattern: /#include\s+[^<"][^>\n]*/m, message: 'Invalid include statement' },
      { pattern: /int\s+main\s*\([^)]*\)\s*[^{]/m, message: 'Missing opening brace after main' }
    ]
  };

  // Check for unbalanced brackets
  const bracketPairs = [
    ['(', ')'],
    ['{', '}'],
    ['[', ']']
  ];

  for (const [open, close] of bracketPairs) {
    const openCount = (code.match(new RegExp('\\' + open, 'g')) || []).length;
    const closeCount = (code.match(new RegExp('\\' + close, 'g')) || []).length;
    if (openCount !== closeCount) {
      errors.push(`Unbalanced brackets: ${openCount} '${open}' vs ${closeCount} '${close}'`);
    }
  }

  // Language-specific checks
  const languageChecks = checks[language] || [];
  for (const check of languageChecks) {
    if (check.pattern.test(code)) {
      errors.push(check.message);
    }
  }

  return errors;
}

// Grounding validation - check if content is grounded in source materials
async function validateGrounding(content) {
  try {
    const openai = getOpenAI();
    
    // Get source materials snippets
    const sourceContext = await getSourceContext(content.topic);
    
    if (sourceContext.length === 0) {
      return {
        type: 'grounding',
        status: 'warning',
        score: 60,
        details: 'No source materials found for grounding check',
        errors: []
      };
    }

    const prompt = `Analyze if the following generated content is grounded in the provided source materials.

SOURCE MATERIALS:
${sourceContext.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}

GENERATED CONTENT:
${content.content.substring(0, 2000)}

Evaluate:
1. Is the content factually consistent with the sources?
2. Does it add unsupported claims?
3. Are key concepts accurately represented?

Respond with JSON:
{
  "grounded": true/false,
  "score": 0-100,
  "issues": ["list of issues if any"],
  "explanation": "brief explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      type: 'grounding',
      status: result.grounded ? 'pass' : (result.score >= 50 ? 'warning' : 'fail'),
      score: result.score || 50,
      details: result.explanation || 'Grounding check completed',
      errors: result.issues || []
    };
  } catch (err) {
    console.error('Grounding validation error:', err);
    return {
      type: 'grounding',
      status: 'warning',
      score: 50,
      details: 'Grounding check encountered an error',
      errors: [err.message]
    };
  }
}

// Get source context for grounding
async function getSourceContext(topic) {
  try {
    const results = await semanticSearch({ query: topic, topK: 3 });
    return results.map(r => r.snippet).filter(Boolean);
  } catch {
    return [];
  }
}

// Rubric-based evaluation
async function evaluateWithRubric(content) {
  try {
    const openai = getOpenAI();
    
    const rubric = content.type === 'theory' ? THEORY_RUBRIC : LAB_RUBRIC;

    const prompt = `Evaluate the following ${content.type} content against this rubric:

RUBRIC:
${rubric}

CONTENT:
${content.content.substring(0, 2500)}

Provide scores for each criterion and an overall assessment.

Respond with JSON:
{
  "criteria": {
    "criterion_name": {"score": 0-100, "feedback": "brief feedback"}
  },
  "overallScore": 0-100,
  "strengths": ["list"],
  "improvements": ["list"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const score = result.overallScore || 50;
    
    return {
      type: 'rubric',
      status: score >= 70 ? 'pass' : (score >= 50 ? 'warning' : 'fail'),
      score,
      details: JSON.stringify({
        criteria: result.criteria,
        strengths: result.strengths,
        improvements: result.improvements
      }),
      errors: result.improvements || []
    };
  } catch (err) {
    return {
      type: 'rubric',
      status: 'warning',
      score: 50,
      details: 'Rubric evaluation encountered an error',
      errors: [err.message]
    };
  }
}

// Rubrics
const THEORY_RUBRIC = `
1. Coherence (0-100): Is the content logically organized and easy to follow?
2. Accuracy (0-100): Is the information factually correct?
3. Completeness (0-100): Does it cover the topic adequately?
4. Clarity (0-100): Is the language clear and appropriate for students?
5. Pedagogical Value (0-100): Does it effectively teach the concept?
`;

const LAB_RUBRIC = `
1. Code Correctness (0-100): Is the code syntactically and logically correct?
2. Relevance (0-100): Does the code address the requested topic?
3. Best Practices (0-100): Does it follow coding standards and conventions?
4. Documentation (0-100): Are comments and explanations adequate?
5. Educational Value (0-100): Does it effectively teach the programming concept?
`;

// AI self-evaluation with explainability
async function aiSelfEvaluation(content) {
  try {
    const openai = getOpenAI();

    const prompt = `You are a critical evaluator. Assess this AI-generated ${content.type} content:

TOPIC: ${content.topic}
CONTENT:
${content.content.substring(0, 2500)}

Provide a thorough self-evaluation:
1. Identify potential inaccuracies or errors
2. Assess overall quality and usefulness
3. Rate confidence in the content's reliability
4. Explain your reasoning

Respond with JSON:
{
  "qualityScore": 0-100,
  "confidenceLevel": "high/medium/low",
  "potentialIssues": ["list of concerns"],
  "strengths": ["list of strengths"],
  "recommendation": "approve/review/reject",
  "reasoning": "detailed explanation of your assessment"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const score = result.qualityScore || 50;
    
    let status = 'pass';
    if (result.recommendation === 'reject' || score < 50) {
      status = 'fail';
    } else if (result.recommendation === 'review' || score < 70) {
      status = 'warning';
    }

    return {
      type: 'ai_evaluation',
      status,
      score,
      details: JSON.stringify({
        confidenceLevel: result.confidenceLevel,
        strengths: result.strengths,
        reasoning: result.reasoning,
        recommendation: result.recommendation
      }),
      errors: result.potentialIssues || []
    };
  } catch (err) {
    return {
      type: 'ai_evaluation',
      status: 'warning',
      score: 50,
      details: 'AI evaluation encountered an error',
      errors: [err.message]
    };
  }
}

// Save validation result to database
async function saveValidationResult(contentId, type, result) {
  await ValidationResult.create({
    generatedContentId: contentId,
    validationType: type,
    status: result.status,
    score: result.score,
    details: result.details,
    errorMessages: result.errors
  });
}

// Calculate overall status from all results
function calculateOverallStatus(results) {
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  
  if (failCount >= 2) return 'fail';
  if (failCount === 1 || warningCount >= 2) return 'warning';
  return 'pass';
}

// Get validation results for content
async function getValidationResults(contentId) {
  const results = await ValidationResult.find({ generatedContentId: contentId })
    .sort({ timestamp: -1 });
  
  return results.map(r => ({
    type: r.validationType,
    status: r.status,
    score: r.score,
    details: r.details,
    errors: r.errorMessages,
    timestamp: r.timestamp
  }));
}

module.exports = {
  validateContent,
  getValidationResults
};
