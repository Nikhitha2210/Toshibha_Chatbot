// Fixed ChatApiClient with correct messages format for backend
import uuid from 'react-native-uuid';

const uuidv4 = () => uuid.v4() as string;

export interface ChatMessage {
  id: string;
  time: string;
  message: string;
  isUser: boolean;
  isStreaming?: boolean;
  agentStatus?: string;
  highlight?: {
    title: string;
    rating: number;
    reviews: number;
    description: string;
  };
  sources?: string[];
  vote?: 'up' | 'down' | null;
  feedback?: string;
}

export interface ChatRequest {
  query: string;
  qid: string;
  uid: string;
  sid: string;
  messages: Array<{content: string; isBot: boolean}>; // Fixed: Now array of objects
  collection: string;
}

export interface VoteRequest {
  qid: string;
  uid: string;
  vote: 'up' | 'down';
}

export interface FeedbackRequest {
  qid: string;
  uid: string;
  feedback: string;
  harmful?: boolean;
  untrue?: boolean;
  unhelpful?: boolean;
}

export class ChatApiClient {
  private baseUrl: string;
  private statusUrl: string;
  private userId: string;
  private sessionId: string;

  constructor() {
    this.baseUrl = 'http://10.11.21.110:8000';
    this.statusUrl = 'http://10.11.21.110:8000';
    this.userId = 'user-' + uuidv4();
    this.sessionId = 'session-' + uuidv4();
  }

  async sendMessage(
    message: string,
    previousMessages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onStatus: (status: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<string> {
    const messageId = uuidv4();
    
    try {
      // Format previous messages correctly for the backend
      const messagesHistory = previousMessages.map(msg => ({
        content: msg.message,
        isBot: !msg.isUser  // Convert isUser to isBot (inverted)
      }));

      const chatRequest: ChatRequest = {
        query: message,
        qid: messageId,
        uid: this.userId,
        sid: this.sessionId,
        messages: messagesHistory, // Now sending array of objects
        collection: 'chatbot'
      };

      console.log('=== Chat Request ===');
      console.log('URL:', `${this.baseUrl}/run`);
      console.log('Request:', chatRequest);

      // Start status monitoring
      const statusInterval = this.startStatusMonitoring(messageId, onStatus);

      // React Native compatible streaming approach
      const response = await fetch(`${this.baseUrl}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      if (!response.ok) {
        clearInterval(statusInterval);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // For React Native, get the full response as text
      const fullResponseText = await response.text();
      console.log('Full response received:', fullResponseText);

      let accumulatedResponse = '';

      // Parse the response and simulate streaming
      const lines = fullResponseText.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line && line.startsWith('data: ')) {
          try {
            const data = line.slice(6); // Remove "data: " prefix
            
            if (data === '[DONE]') {
              clearInterval(statusInterval);
              onComplete();
              return accumulatedResponse;
            }

            // Try to parse as JSON first
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedResponse += parsed.content;
                onChunk(parsed.content);
                
                // Add a small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            } catch (parseError) {
              // If not JSON, treat as plain text
              if (data && data !== '') {
                accumulatedResponse += data;
                onChunk(data);
                
                // Add a small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
          } catch (error) {
            console.log('Error processing line:', line, error);
          }
        } else if (line && !line.startsWith('data:') && line !== '') {
          // Handle plain text responses
          accumulatedResponse += line + ' ';
          onChunk(line + ' ');
          
          // Add a small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      clearInterval(statusInterval);
      onComplete();
      return accumulatedResponse;

    } catch (error) {
      console.error('Chat API Error:', error);
      onError(error instanceof Error ? error.message : 'Failed to send message');
      return '';
    }
  }

  private startStatusMonitoring(messageId: string, onStatus: (status: string) => void): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const response = await fetch(`${this.statusUrl}/currentStatus?qid=${messageId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            onStatus(this.getLoadingMessageFromAgentStatus(data.status));
          }
        }
      } catch (error) {
        console.log('Status check error:', error);
      }
    }, 1000);
  }

  private getLoadingMessageFromAgentStatus(agentStatus: string): string {
    if (
      agentStatus.includes("UnsupportedProduct") ||
      agentStatus.includes("NotenoughContext") ||
      agentStatus.includes("finalfinalFormatedOutput")
    ) {
      return "Generating an answer";
    } else if (
      agentStatus.includes("getIssuseContexFromDetails") ||
      agentStatus.includes("finalFormatedOutput") ||
      agentStatus.includes("func_incidentScoringChain")
    ) {
      return "Getting context for the issue";
    } else if (
      agentStatus.includes("getIssuseContexFromSummary") ||
      agentStatus.includes("processQdrantOutput")
    ) {
      return "Processing the context from the database";
    } else if (agentStatus.includes("getReleatedChatText")) {
      return "Getting related chat history";
    }
    
    return "";
  }

  async submitVote(messageId: string, vote: 'up' | 'down'): Promise<void> {
    try {
      const voteRequest: VoteRequest = {
        qid: messageId,
        uid: this.userId,
        vote: vote
      };

      const response = await fetch(`${this.baseUrl}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteRequest),
      });

      if (!response.ok) {
        throw new Error(`Vote failed: ${response.status}`);
      }

      console.log(`Vote ${vote} submitted for message ${messageId}`);
    } catch (error) {
      console.error('Vote submission error:', error);
      throw error;
    }
  }

  async submitFeedback(
    messageId: string,
    feedback: string,
    harmful: boolean = false,
    untrue: boolean = false,
    unhelpful: boolean = false
  ): Promise<void> {
    try {
      const feedbackRequest: FeedbackRequest = {
        qid: messageId,
        uid: this.userId,
        feedback: feedback,
        harmful: harmful,
        untrue: untrue,
        unhelpful: unhelpful
      };

      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackRequest),
      });

      if (!response.ok) {
        throw new Error(`Feedback failed: ${response.status}`);
      }

      console.log('Feedback submitted for message', messageId);
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  }

  async getPastSessions(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pastSessions?uid=${this.userId}`);
      if (!response.ok) {
        throw new Error(`Failed to get past sessions: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get past sessions error:', error);
      return [];
    }
  }
}