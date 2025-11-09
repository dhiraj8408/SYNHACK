import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { codeService } from '@/services/codeService';
import { Play, RotateCcw, Download, Copy, Code2, CheckCircle2, XCircle } from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python', template: 'def solution():\n    # Write your code here\n    print("Hello, World!")\n    return\n\nif __name__ == "__main__":\n    solution()' },
  { value: 'javascript', label: 'JavaScript', template: 'function solution() {\n    // Write your code here\n    console.log("Hello, World!");\n}\n\nsolution();' },
  { value: 'java', label: 'Java', template: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        System.out.println("Hello, World!");\n    }\n}' },
  { value: 'cpp', label: 'C++', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
  { value: 'c', label: 'C', template: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    printf("Hello, World!\\n");\n    return 0;\n}' },
];

interface CodingPracticeTabProps {
  courseId: string;
}

export default function CodingPracticeTab({ courseId }: CodingPracticeTabProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES.find(l => l.value === 'python')?.template || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.value === selectedLanguage);
    if (lang) {
      setCode(lang.template);
      setOutput('');
      setExecutionTime(null);
      setHasError(false);
    }
  }, [selectedLanguage]);

  const executeCode = async () => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please write some code before running',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setOutput('Running...\n');
    setExecutionTime(null);
    setHasError(false);

    const startTime = performance.now();

    try {
      // Call backend API for code execution
      const result = await codeService.executeCode(selectedLanguage, code);

      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setHasError(!result.success);

      if (result.success) {
        setOutput(result.output || '✅ Code executed successfully (no output)');
      } else {
        setOutput(`❌ ${result.output || 'Execution failed'}`);
      }
    } catch (error: any) {
      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setHasError(true);
      
      const errorMessage = error.response?.data?.output || error.response?.data?.message || error.message;
      setOutput(`❌ Execution Error: ${errorMessage}`);
      
      toast({
        title: 'Execution Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    const lang = LANGUAGES.find(l => l.value === selectedLanguage);
    if (lang) {
      setCode(lang.template);
      setOutput('');
      setExecutionTime(null);
      setHasError(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard',
    });
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast({
      title: 'Copied',
      description: 'Output copied to clipboard',
    });
  };

  const downloadCode = () => {
    const extension = {
      python: 'py',
      javascript: 'js',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    }[selectedLanguage] || 'txt';

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Code file downloaded',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Coding Practice
              </CardTitle>
              <CardDescription>
                Practice coding in your preferred language. Write, run, and test your code.
              </CardDescription>
            </div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={executeCode} disabled={isRunning} className="flex-1 min-w-[120px]">
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>
            <Button variant="outline" onClick={resetCode} disabled={isRunning}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={copyCode} disabled={isRunning}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
            <Button variant="outline" onClick={downloadCode} disabled={isRunning}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Code Editor</Label>
                <Badge variant="outline">{selectedLanguage.toUpperCase()}</Badge>
              </div>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-sm min-h-[500px] resize-none"
                placeholder="Write your code here..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Output</Label>
                <div className="flex items-center gap-2">
                  {executionTime !== null && (
                    <Badge variant="secondary" className="text-xs">
                      {executionTime.toFixed(2)}ms
                    </Badge>
                  )}
                  {output && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyOutput}
                      className="h-6 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div
                className={`min-h-[500px] p-4 rounded-md border font-mono text-sm whitespace-pre-wrap overflow-auto ${
                  hasError
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : 'bg-muted'
                }`}
              >
                {output || (
                  <span className="text-muted-foreground">
                    Output will appear here after you run your code...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs text-primary-foreground">
              <strong>✓ Backend Execution:</strong> Your code is executed on a secure backend server. 
              All supported languages (Python, JavaScript, Java, C++, C) are executed remotely.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

