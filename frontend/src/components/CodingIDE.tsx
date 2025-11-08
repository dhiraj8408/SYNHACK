import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, RotateCcw, Download, Copy, Code2 } from 'lucide-react';

interface CodingIDEProps {
  className?: string;
}

const LANGUAGES = [
  { value: 'python', label: 'Python', template: 'def solution():\n    # Write your code here\n    pass\n\nif __name__ == "__main__":\n    solution()' },
  { value: 'javascript', label: 'JavaScript', template: 'function solution() {\n    // Write your code here\n}\n\nsolution();' },
  { value: 'java', label: 'Java', template: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}' },
  { value: 'cpp', label: 'C++', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}' },
  { value: 'c', label: 'C', template: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}' },
];

export default function CodingIDE({ className }: CodingIDEProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES.find(l => l.value === 'python')?.template || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.value === selectedLanguage);
    if (lang) {
      setCode(lang.template);
      setOutput('');
      setExecutionTime(null);
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

    try {
      const startTime = performance.now();
      
      // Simulate code execution (in a real app, you'd call an API)
      // For now, we'll use a simple timeout to simulate execution
      await new Promise(resolve => setTimeout(resolve, 500));

      // For demonstration, we'll evaluate JavaScript code
      // In production, you'd send this to a secure code execution API
      let result = '';
      let error = null;

      if (selectedLanguage === 'javascript') {
        try {
          // Capture console.log output
          const logs: string[] = [];
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
            originalLog(...args);
          };

          // Execute code in a sandbox (simplified - in production use a proper sandbox)
          const func = new Function(code);
          func();

          result = logs.join('\n') || 'Code executed successfully (no output)';
          console.log = originalLog;
        } catch (e: any) {
          error = e.message;
        }
      } else {
        // For other languages, show a message that they need a backend service
        result = `Code execution for ${selectedLanguage} requires a backend service.\n\nYour code:\n${code}\n\nNote: This is a frontend-only demo. In production, code execution would be handled by a secure backend service.`;
      }

      const endTime = performance.now();
      setExecutionTime(endTime - startTime);

      if (error) {
        setOutput(`Error: ${error}`);
      } else {
        setOutput(result || 'Code executed successfully (no output)');
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
      toast({
        title: 'Execution Error',
        description: error.message,
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
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard',
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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Coding Practice IDE
            </CardTitle>
            <CardDescription>
              Practice coding in your preferred language
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
        <div className="flex gap-2">
          <Button onClick={executeCode} disabled={isRunning} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Run Code'}
          </Button>
          <Button variant="outline" onClick={resetCode}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={copyCode}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" onClick={downloadCode}>
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
              className="font-mono text-sm min-h-[400px] resize-none"
              placeholder="Write your code here..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Output</Label>
              {executionTime !== null && (
                <Badge variant="secondary" className="text-xs">
                  {executionTime.toFixed(2)}ms
                </Badge>
              )}
            </div>
            <div className="min-h-[400px] p-4 bg-muted rounded-md border font-mono text-sm whitespace-pre-wrap overflow-auto">
              {output || 'Output will appear here...'}
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This is a frontend-only code editor. For full code execution with all languages,
            a secure backend service would be required. JavaScript code can be executed in the browser for demonstration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

