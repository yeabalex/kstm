"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AUTH_BASE_URL } from "@/const";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { nanoid } from "nanoid";
import { useAuth } from "@/context/AuthContext";
import { MultiStepLoader } from "../ui/multi-step-loader";
import BotTrainingSuccess from "../sucesss/Success";
import BotTrainingFailed from "../error/ErrorTraining";
import { useRouter } from "next/navigation";
import {
  FileText,
  Database,
  FileJson,
  FileType,
  Globe,
  X,
  Plus,
  Upload,
  ArrowRight,
  Key,
  Sliders,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface AIModel {
  provider: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface BotMetadata {
  name: string;
  description: string;
  tags: string[];
}

interface AIConfig {
  selectedProvider: string;
  selectedModel: string;
  useCustomAPIKey: boolean;
  apiKey: string;
  temperature: number;
}

interface UploadResponse {
  success: boolean;
  files: {
    id: string;
    fileUrl: string;
    fileType: string;
  }[];
  urls?: string[];
}

interface FileSelection {
  [key: string]: File[];
}

const loadingStates = [
  { text: "Uploading source files" },
  { text: "Queueing BullMQ ingestion job" },
  { text: "Extracting & chunking documents" },
  { text: "Indexing embeddings into Neo4j vector store" },
];

const fileTypeConfig: Record<
  string,
  { label: string; ext: string; icon: React.ElementType }
> = {
  pdf: { label: "PDF", ext: ".pdf", icon: FileText },
  csv: { label: "CSV", ext: ".csv", icon: Database },
  json: { label: "JSON", ext: ".json", icon: FileJson },
  txt: { label: "TXT", ext: ".txt", icon: FileType },
};

const AITrainingPage = () => {
  const [botMetadata, setBotMetadata] = useState<BotMetadata>({
    name: "",
    description: "",
    tags: [],
  });
  const [currentState, setCurrentState] = useState(-1);
  const { userId } = useAuth();
  const [botId, setBotId] = useState<string | null>(null);
  const [kbId, setKbId] = useState<string | null>(null);
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");

  const [aiConfig, setAIConfig] = useState<AIConfig>({
    selectedProvider: "gemini",
    selectedModel: "gemini-2.5-flash",
    useCustomAPIKey: false,
    apiKey: "",
    temperature: 0.7,
  });

  const [promptTemplate, setPromptTemplate] = useState("");
  const [trainingStatus, setTrainingStatus] = useState<
    null | "pending" | "success" | "error"
  >(null);
  const [trainingMessage, setTrainingMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const pollingCancelRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      pollingCancelRef.current = true;
    };
  }, []);

  const [uploadedFiles, setUploadedFiles] = useState<{
    csv: string[];
    pdf: string[];
    txt: string[];
    json: string[];
    web_url: string[];
  }>({
    csv: [],
    pdf: [],
    txt: [],
    json: [],
    web_url: [],
  });

  const [selectedFiles, setSelectedFiles] = useState<FileSelection>({
    pdf: [],
    csv: [],
    json: [],
    txt: [],
  });
  const [enteredUrls, setEnteredUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<number>(0);

  const aiModels: AIModel[] = [
    {
      provider: "gemini",
      name: "gemini-2.5-flash",
      description: "Free tier — Fast & high accuracy",
      enabled: true,
    },
    {
      provider: "gemini",
      name: "gemini-2.5-flash-lite",
      description: "Free tier — Lowest latency & highest quota",
      enabled: true,
    },
    {
      provider: "gemini",
      name: "gemini-2.0-flash",
      description: "Free tier — Balanced grounded synthesis",
      enabled: true,
    },
    {
      provider: "gemini",
      name: "gemini-2.5-pro",
      description: "Free tier — Deep multi-document reasoning",
      enabled: true,
    },
    {
      provider: "gemini",
      name: "gemma-3-27b-it",
      description: "Free tier — Open-weights Gemma 3 (27B)",
      enabled: true,
    },
    {
      provider: "openai",
      name: "gpt-4o",
      description: "Advanced reasoning and instructions",
      enabled: false,
    },
    {
      provider: "claude",
      name: "claude-3-7-sonnet",
      description: "Highest capability Claude model",
      enabled: false,
    },
    {
      provider: "deepseek",
      name: "deepseek-r1",
      description: "Specialized reasoning model",
      enabled: false,
    },
  ];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!botMetadata.tags.includes(tagInput.trim())) {
        setBotMetadata({
          ...botMetadata,
          tags: [...botMetadata.tags, tagInput.trim()],
        });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setBotMetadata({
      ...botMetadata,
      tags: botMetadata.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBotMetadata({
      ...botMetadata,
      [name]: value,
    });
  };

  const handleAIConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : type === "number" || type === "range"
        ? parseFloat(value)
        : value;

    setAIConfig({
      ...aiConfig,
      [name]: newValue,
    });
  };

  useEffect(() => {
    const fileCount = Object.values(selectedFiles).reduce(
      (acc, files) => acc + files.length,
      0
    );
    setTotalFiles(fileCount + enteredUrls.length);
  }, [selectedFiles, enteredUrls]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (totalFiles + newFiles.length > 3) {
        setUploadStatus("You can attach up to 3 knowledge sources per assistant.");
        return;
      }
      setUploadStatus(null);
      setSelectedFiles((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), ...newFiles],
      }));
    }
  };

  const removeFile = (type: string, index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev[type]];
      newFiles.splice(index, 1);
      return {
        ...prev,
        [type]: newFiles,
      };
    });
  };

  const handleAddUrl = () => {
    const isValidUrl = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(
      urlInput.trim()
    );
    if (!isValidUrl) {
      setUploadStatus("Enter a valid URL starting with http:// or https://");
      return;
    }
    if (totalFiles >= 3) {
      setUploadStatus("You can attach up to 3 knowledge sources in total.");
      return;
    }
    setEnteredUrls((prev) => [...prev, urlInput.trim()]);
    setUrlInput("");
    setUploadStatus(null);
  };

  const removeUrl = (index: number) => {
    setEnteredUrls((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUploadResponse = (response: UploadResponse) => {
    const newUploadedFiles = {
      csv: [] as string[],
      pdf: [] as string[],
      txt: [] as string[],
      json: [] as string[],
      web_url: [] as string[],
    };

    response.files.forEach((file) => {
      switch (file.fileType) {
        case "csv":
          newUploadedFiles.csv.push(file.fileUrl);
          break;
        case "pdf":
          newUploadedFiles.pdf.push(file.fileUrl);
          break;
        case "txt":
          newUploadedFiles.txt.push(file.fileUrl);
          break;
        case "json":
          newUploadedFiles.json.push(file.fileUrl);
          break;
      }
    });

    if (response.urls) {
      newUploadedFiles.web_url = [
        ...newUploadedFiles.web_url,
        ...response.urls,
      ];
    }

    setUploadedFiles(newUploadedFiles);
    return newUploadedFiles;
  };

  const hasSelectedFiles = () => {
    return Object.values(selectedFiles).some((files) => files.length > 0);
  };

  const pollIngestionStatus = async (targetBotId: string) => {
    const maxAttempts = 120; // up to ~2.5 minutes at 1.2s interval
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (pollingCancelRef.current) {
        return;
      }

      try {
        const { data } = await axios.get(
          `${AUTH_BASE_URL}/api/v1/bot/${targetBotId}/status`,
          { withCredentials: true }
        );

        const workerProgress =
          typeof data.progress === "number" ? data.progress : 0;
        // Scale overall progress from 20% (queued) to 100% (indexed)
        const scaledProgress = Math.min(
          100,
          Math.max(20, Math.round(20 + workerProgress * 0.8))
        );
        setProgressPercent(scaledProgress);

        if (data.status === "READY" || data.job_state === "completed") {
          setProgressPercent(100);
          setCurrentState(3);
          setTrainingStatus("success");
          setTrainingMessage(`Assistant "${botMetadata.name}" deployed.`);
          return;
        }

        if (data.status === "FAILED" || data.job_state === "failed") {
          throw new Error(
            data.error ||
              "Document ingestion failed in worker. Check source URLs or files."
          );
        }

        if (workerProgress >= 80) {
          setCurrentState(3);
          setTrainingMessage(
            "Embedding chunks & indexing into Neo4j vector store..."
          );
        } else if (workerProgress >= 5 || data.job_state === "active") {
          setCurrentState(2);
          setTrainingMessage("Extracting & chunking knowledge sources...");
        } else {
          setCurrentState(1);
          setTrainingMessage("Waiting for BullMQ ingestion worker...");
        }
      } catch (pollErr: any) {
        // Re-throw if it's an explicit worker failure
        if (
          pollErr.message &&
          !axios.isAxiosError(pollErr)
        ) {
          throw pollErr;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    // If still indexing after maxAttempts, let user proceed while indexing finishes
    setTrainingStatus("success");
  };

  const handleStartTraining = async () => {
    if (!botMetadata.name.trim()) {
      setTrainingStatus("error");
      setTrainingMessage("Assistant name is required.");
      return;
    }

    if (aiConfig.useCustomAPIKey && !aiConfig.apiKey.trim()) {
      setTrainingStatus("error");
      setTrainingMessage("API key is required when custom key mode is enabled.");
      return;
    }

    pollingCancelRef.current = false;
    setTrainingStatus("pending");
    setProgressPercent(5);
    setCurrentState(0);

    const generatedBotId = `${nanoid()}`;
    const generatedKbId = `${nanoid()}`;
    setBotId(generatedBotId);
    setKbId(generatedKbId);

    try {
      let processedFiles = {
        csv: [] as string[],
        pdf: [] as string[],
        txt: [] as string[],
        json: [] as string[],
        web_url: [] as string[],
      };

      if (hasSelectedFiles()) {
        setTrainingMessage("Uploading source files...");
        setCurrentState(0);
        setProgressPercent(10);

        const formData = new FormData();
        for (const [type, files] of Object.entries(selectedFiles)) {
          files.forEach((file) => formData.append(type, file));
        }

        const queryParams = new URLSearchParams({
          user_id: userId!,
          bot_id: generatedBotId,
          kb_id: generatedKbId,
        });

        const uploadResponse = await axios.post<UploadResponse>(
          `/api/v1/upload?${queryParams.toString()}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (!uploadResponse.data.success) {
          throw new Error("File upload failed");
        }

        processedFiles = handleUploadResponse(uploadResponse.data);
      }

      if (enteredUrls.length > 0) {
        processedFiles.web_url = [...processedFiles.web_url, ...enteredUrls];
      }

      setTrainingMessage("Queueing BullMQ ingestion job...");
      setCurrentState(1);
      setProgressPercent(20);

      const botCreationData = {
        user_id: userId,
        bot_id: generatedBotId,
        kb_id: generatedKbId,
        csv: processedFiles.csv.length > 0 ? processedFiles.csv : undefined,
        pdf: processedFiles.pdf.length > 0 ? processedFiles.pdf : undefined,
        txt: processedFiles.txt.length > 0 ? processedFiles.txt : undefined,
        json: processedFiles.json.length > 0 ? processedFiles.json : undefined,
        web_url:
          processedFiles.web_url.length > 0
            ? processedFiles.web_url
            : undefined,
        prompt_template: promptTemplate || undefined,
        temperature: aiConfig.temperature,
        bot_name: botMetadata.name,
        model: aiConfig.selectedModel,
        description: botMetadata.description || undefined,
        tags: botMetadata.tags.length > 0 ? botMetadata.tags : undefined,
        api_key: aiConfig.useCustomAPIKey ? aiConfig.apiKey : undefined,
      };

      await axios.post(`/api/v1/bot/create`, botCreationData, {
        withCredentials: true,
      });

      // Poll BullMQ worker progress non-blockingly until READY or FAILED
      await pollIngestionStatus(generatedBotId);
    } catch (error: any) {
      console.error("Training error:", error);
      setTrainingStatus("error");
      setTrainingMessage(
        `Provisioning failed: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setCurrentState(-1);
    }
  };

  const handleContinueInBackground = () => {
    pollingCancelRef.current = true;
    router.push("/dashboard");
  };

  async function handleGoToChat() {
    router.push(`/chat/${botId}/${kbId}`);
  }

  const handleReset = () => {
    setTrainingStatus(null);
    setTrainingMessage("");
    setProgressPercent(0);
    setBotMetadata({ name: "", description: "", tags: [] });
    setSelectedFiles({ pdf: [], csv: [], json: [], txt: [] });
    setEnteredUrls([]);
    setPromptTemplate("");
  };

  if (trainingStatus === "pending") {
    return (
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={trainingStatus === "pending"}
        curr={currentState}
        progress={progressPercent}
        statusText={trainingMessage}
        onContinueInBackground={handleContinueInBackground}
      />
    );
  }

  if (trainingStatus === "success") {
    return (
      <BotTrainingSuccess
        botId={botId}
        botName={botMetadata.name}
        kbId={kbId}
        onGoToChat={handleGoToChat}
        onReset={handleReset}
      />
    );
  }

  if (trainingStatus === "error") {
    return (
      <BotTrainingFailed
        errorMessage={trainingMessage}
        botName={botMetadata.name || "Untitled Assistant"}
        onRetry={handleStartTraining}
        onBack={() => setTrainingStatus(null)}
      />
    );
  }

  return (
    <div className="min-h-full bg-zinc-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Breadcrumb & Header */}
        <div className="mb-8 pb-6 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumb className="mb-2">
              <BreadcrumbList className="text-xs text-zinc-500">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="hover:text-zinc-900 transition-colors"
                  >
                    Assistants
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-zinc-900 font-medium">
                    New Assistant
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Configure Knowledge-Grounded Assistant
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Define identity, select model parameters, attach up to 3 knowledge base sources, and customize the system prompt.
            </p>
          </div>

          <button
            onClick={handleStartTraining}
            disabled={!botMetadata.name.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors self-start sm:self-auto shrink-0"
          >
            <span>Deploy Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Two-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Identity, Knowledge Sources, Prompt Template */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Identity */}
            <section className="bg-white border border-zinc-200/90 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    1. Identity & Metadata
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Displayed in the workspace and on the public chat interface.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  REQUIRED
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Assistant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={botMetadata.name}
                    onChange={handleMetadataChange}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                    placeholder="e.g. Stripe Billing Docs Assistant"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={botMetadata.description}
                    onChange={handleMetadataChange}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors resize-none"
                    placeholder="Briefly describe what documents or domain this assistant covers..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                    placeholder="Type a tag and press Enter (e.g. internal, api, v2)"
                  />
                  {botMetadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {botMetadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-md text-xs font-mono"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-zinc-400 hover:text-zinc-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Knowledge Sources */}
            <section className="bg-white border border-zinc-200/90 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    2. Knowledge Base Sources
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Attach PDF, CSV, JSON, or TXT files, or add live web URLs to index into Neo4j.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                    {totalFiles} / 3 sources
                  </span>
                </div>
              </div>

              {/* File Upload Picker */}
              <div className="border border-dashed border-zinc-300 rounded-xl p-5 bg-zinc-50/60 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-900">
                        Select document files by format
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Supported: .pdf, .csv, .json, .txt (up to 3 total sources)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.keys(selectedFiles).map((type) => {
                    const cfg = fileTypeConfig[type] || {
                      label: type.toUpperCase(),
                      ext: `.${type}`,
                      icon: FileText,
                    };
                    const Icon = cfg.icon;
                    return (
                      <label
                        key={type}
                        className={`px-3 py-2.5 bg-white border border-zinc-200 rounded-lg cursor-pointer hover:border-zinc-400 transition-colors flex items-center justify-between text-xs font-medium text-zinc-800 ${
                          totalFiles >= 3 ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-zinc-500" />
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {cfg.ext}
                        </span>
                        <input
                          type="file"
                          name={type}
                          accept={`.${type}`}
                          multiple
                          disabled={totalFiles >= 3}
                          onChange={(e) => handleFileChange(e, type)}
                          className="hidden"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Web URL Input */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Add Web Page URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input
                      type="url"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                      placeholder="https://docs.example.com/guide"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={totalFiles >= 3 || !urlInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add URL</span>
                  </button>
                </div>
              </div>

              {uploadStatus && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{uploadStatus}</span>
                </div>
              )}

              {/* Attached Sources List */}
              {(hasSelectedFiles() || enteredUrls.length > 0) && (
                <div className="space-y-2 pt-3 border-t border-zinc-100">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                    Queued Sources ({totalFiles})
                  </div>

                  {Object.entries(selectedFiles).map(([type, files]) =>
                    files.map((file, index) => (
                      <div
                        key={`${type}-${index}`}
                        className="flex items-center justify-between bg-zinc-50 px-3.5 py-2.5 rounded-lg border border-zinc-200/80"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-600 shrink-0">
                            {type}
                          </span>
                          <span className="text-xs font-medium text-zinc-800 truncate">
                            {file.name}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                            {Math.max(1, Math.round(file.size / 1024))} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(type, index)}
                          className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                          aria-label="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}

                  {enteredUrls.map((url, index) => (
                    <div
                      key={`url-${index}`}
                      className="flex items-center justify-between bg-zinc-50 px-3.5 py-2.5 rounded-lg border border-zinc-200/80"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-600 shrink-0">
                          URL
                        </span>
                        <span className="text-xs font-mono text-zinc-700 truncate">
                          {url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUrl(index)}
                        className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                        aria-label="Remove URL"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {enteredUrls.map((url, index) => (
                <input key={index} type="hidden" name="urls" value={url} />
              ))}
            </section>

            {/* Section 3: System Prompt Template */}
            <section className="bg-white border border-zinc-200/90 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    3. System Prompt Template
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Optional instructions injected alongside retrieved context chunks.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  OPTIONAL
                </span>
              </div>

              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                placeholder={`You are a technical assistant. Answer the user's {{question}} strictly using the provided {{context}}. If the answer is not in the context, state that clearly.`}
                rows={6}
              />
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-zinc-500">
                <span>Available interpolation variables:</span>
                <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-mono text-zinc-700">
                  {"{{context}}"}
                </code>
                <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-mono text-zinc-700">
                  {"{{question}}"}
                </code>
              </div>
            </section>
          </div>

          {/* Right Column: Model & Inference Configuration */}
          <div className="space-y-6">
            <section className="bg-white border border-zinc-200/90 rounded-xl p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <Sliders className="w-4 h-4 text-zinc-600" />
                <h2 className="text-sm font-semibold text-zinc-950">
                  Model & Inference
                </h2>
              </div>

              <div className="space-y-5">
                {/* Provider */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-2">
                    Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["gemini", "openai", "claude", "deepseek"].map(
                      (provider) => {
                        const enabled = provider === "gemini";
                        const selected = aiConfig.selectedProvider === provider;
                        return (
                          <button
                            type="button"
                            key={provider}
                            disabled={!enabled}
                            onClick={() =>
                              enabled &&
                              setAIConfig({
                                ...aiConfig,
                                selectedProvider: provider,
                              })
                            }
                            className={`px-3 py-2 rounded-lg border text-left transition-colors flex items-center justify-between ${
                              selected
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : enabled
                                ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                                : "border-zinc-100 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                            }`}
                          >
                            <span className="text-xs font-medium capitalize">
                              {provider}
                            </span>
                            {!enabled && (
                              <span className="text-[9px] font-mono uppercase">
                                Soon
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Model Select */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Model
                  </label>
                  <select
                    name="selectedModel"
                    value={aiConfig.selectedModel}
                    onChange={handleAIConfigChange}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  >
                    {aiModels
                      .filter(
                        (model) =>
                          model.provider === aiConfig.selectedProvider &&
                          model.enabled
                      )
                      .map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.name} — {model.description}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-zinc-700">
                      Temperature
                    </label>
                    <span className="text-xs font-mono text-zinc-900 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                      {aiConfig.temperature.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    name="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiConfig.temperature}
                    onChange={handleAIConfigChange}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
                    <span>0.0 Grounded</span>
                    <span>0.5 Balanced</span>
                    <span>1.0 Creative</span>
                  </div>
                </div>

                {/* Custom API Key Toggle */}
                <div className="pt-4 border-t border-zinc-100">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                      <Key className="w-3.5 h-3.5 text-zinc-400" />
                      Bring your own API key
                    </span>
                    <input
                      type="checkbox"
                      id="useCustomAPIKey"
                      name="useCustomAPIKey"
                      checked={aiConfig.useCustomAPIKey}
                      onChange={handleAIConfigChange}
                      className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                    />
                  </label>

                  {aiConfig.useCustomAPIKey && (
                    <div className="mt-3">
                      <input
                        type="password"
                        name="apiKey"
                        value={aiConfig.apiKey}
                        onChange={handleAIConfigChange}
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        placeholder="AIzaSy..."
                      />
                    </div>
                  )}
                </div>

                {/* Summary & Deploy Button */}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <div className="bg-zinc-50 border border-zinc-200/70 rounded-lg p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Model</span>
                      <span className="font-mono text-zinc-800">
                        {aiConfig.selectedModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sources queued</span>
                      <span className="font-mono text-zinc-800">
                        {totalFiles} / 3
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Vector index</span>
                      <span className="font-mono text-zinc-800">Neo4j</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartTraining}
                    disabled={!botMetadata.name.trim()}
                    className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Deploy Assistant</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITrainingPage;
