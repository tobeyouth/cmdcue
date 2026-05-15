import { Action, ActionPanel, Form, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { configPath, DEFAULT_AI_SETTINGS, loadConfig, saveConfig, type AiSettings } from "@cmdcue/core";

const LANGUAGES = [
  { id: "en", title: "English", subtitle: "Use English descriptions" },
  { id: "zh", title: "中文", subtitle: "使用中文描述" }
];

function LanguageSettings() {
  const currentLanguage = loadConfig().language;
  return (
    <List navigationTitle="Language">
      {LANGUAGES.map((language) => (
        <List.Item
          key={language.id}
          title={language.title}
          subtitle={language.subtitle}
          accessories={[{ text: language.id }, language.id === currentLanguage ? { text: "current" } : {}]}
          actions={
            <ActionPanel>
              <Action
                title="Use Language"
                icon={Icon.Globe}
                onAction={async () => {
                  saveConfig({ ...loadConfig(), language: language.id });
                  await showToast({ style: Toast.Style.Success, title: "Language updated", message: language.title });
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function AIProviderSettings() {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);

  useEffect(() => {
    setSettings(loadConfig().ai);
  }, []);

  async function save(nextSettings: AiSettings) {
    saveConfig({ ...loadConfig(), ai: nextSettings });
    await showToast({ style: Toast.Style.Success, title: "AI settings saved" });
  }

  return (
    <Form
      navigationTitle="AI Provider"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save AI Settings"
            onSubmit={async (values) => {
              await save({
                enabled: Boolean(values.enabled),
                baseUrl: String(values.baseUrl ?? ""),
                apiKey: String(values.apiKey ?? ""),
                model: String(values.model ?? ""),
                temperature: Number(values.temperature ?? DEFAULT_AI_SETTINGS.temperature),
                maxTokens: Number(values.maxTokens ?? DEFAULT_AI_SETTINGS.maxTokens)
              });
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Checkbox id="enabled" title="Enabled" label="Use custom AI provider" defaultValue={settings.enabled} />
      <Form.TextField id="baseUrl" title="Base URL" placeholder="https://api.openai.com/v1" defaultValue={settings.baseUrl} />
      <Form.PasswordField id="apiKey" title="API Key" placeholder="sk-..." defaultValue={settings.apiKey} />
      <Form.TextField id="model" title="Model" placeholder="gpt-4o-mini" defaultValue={settings.model} />
      <Form.TextField id="temperature" title="Temperature" placeholder="0.2" defaultValue={String(settings.temperature)} />
      <Form.TextField id="maxTokens" title="Max Tokens" placeholder="600" defaultValue={String(settings.maxTokens)} />
      <Form.Description text={`Config file: ${configPath()}`} />
    </Form>
  );
}

export default function Command() {
  return (
    <List>
      <List.Item
        title="Language"
        subtitle={`Choose display language (${loadConfig().language})`}
        icon={Icon.Globe}
        actions={
          <ActionPanel>
            <Action.Push title="Open Language Settings" icon={Icon.Globe} target={<LanguageSettings />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="AI Provider"
        subtitle="Optional OpenAI-compatible provider stored locally"
        icon={Icon.Stars}
        actions={
          <ActionPanel>
            <Action.Push title="Open AI Provider Settings" icon={Icon.Stars} target={<AIProviderSettings />} />
          </ActionPanel>
        }
      />
    </List>
  );
}
