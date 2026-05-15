import { Action, ActionPanel, Detail, Form, Icon, showToast, Toast, environment, launchCommand, LaunchType } from "@raycast/api";
import { join } from "node:path";
import { useState } from "react";
import {
  askOpenAICompatible,
  buildGroundedAnswerPrompt,
  commandDescription,
  isAiConfigured,
  loadConfig,
  loadOperations,
  operationTitle,
  preferredCommandText,
  searchOperations,
  shortcutDescription,
  shortcutKeys
} from "@cmdcue/core";

function Answer({ question }: { question: string }) {
  const config = loadConfig();
  const language = config.language;
  const aiSettings = config.ai;
  const operations = loadOperations(join(environment.assetsPath, "packs"));
  const results = searchOperations(question, operations, 6);
  const top = results[0]?.operation;
  const prompt = buildGroundedAnswerPrompt(question, results, language);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const localMarkdown = top
    ? [
        `# ${operationTitle(top, language)}`,
        ...top.commands.map((command) => `- \`${preferredCommandText(command)}\` - ${commandDescription(command, language)} (${command.risk})`),
        ...top.shortcuts.map((shortcut) => `- \`${shortcutKeys(shortcut.keys)}\` - ${shortcutDescription(shortcut, language)}`),
        ...(top.notes ?? []).map((note) => `- ${note}`)
      ]
        .filter(Boolean)
        .join("\n\n")
    : [
        "# No confident local match",
        "",
        "CmdCue did not find a confident local operation. You can copy the grounding prompt, or configure optional AI settings if you have API access."
      ].join("\n");

  return (
    <Detail
      isLoading={isLoading}
      markdown={answer ? `# AI Answer\n\n${answer}\n\n## Local Result\n\n${localMarkdown}` : localMarkdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Grounding Prompt" content={prompt} icon={Icon.Text} />
          {isAiConfigured(aiSettings) ? (
            <Action
              title="Ask AI"
              icon={Icon.Stars}
              onAction={async () => {
                setIsLoading(true);
                try {
                  const response = await askOpenAICompatible(prompt, aiSettings);
                  setAnswer(response);
                } catch (error) {
                  await showToast({ style: Toast.Style.Failure, title: "AI request failed", message: String(error) });
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          ) : (
            <Action
              title="Open Settings"
              icon={Icon.Gear}
              onAction={async () => {
                await launchCommand({ name: "settings", type: LaunchType.UserInitiated });
              }}
            />
          )}
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const [question, setQuestion] = useState("");

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.Push title="Search Local Answer" target={<Answer question={question} />} />
        </ActionPanel>
      }
    >
      <Form.TextField id="question" title="Question" placeholder="如何关掉 vim?" value={question} onChange={setQuestion} />
    </Form>
  );
}
