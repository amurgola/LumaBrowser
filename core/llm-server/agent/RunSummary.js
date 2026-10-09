const AgentLoopText = require('./AgentLoopText');
const CompletionSender = require('./CompletionSender');

class RunSummary {
  static MAX_CHARS = 150;
  static MAX_TOKENS = 60;

  static async generate(llm, finalResponse, toolCalls) {
    const fromModel = await RunSummary._askModel(llm, finalResponse, toolCalls);
    if (fromModel != null) return fromModel;
    return RunSummary._firstSentence(finalResponse);
  }

  static async _askModel(llm, finalResponse, toolCalls) {
    try {
      const result = await llm.sendCompletion(CompletionSender.SLOT_ID, [
        { role: 'system', content: AgentLoopText.SUMMARY_INSTRUCTION },
        { role: 'user', content: AgentLoopText.summaryRequest(toolCalls, finalResponse) },
      ], { temperature: 0, max_tokens: RunSummary.MAX_TOKENS });
      if (!result.success) return null;
      const text = result.response?.choices?.[0]?.message?.content || '';
      return text.trim().slice(0, RunSummary.MAX_CHARS);
    } catch (_) {
      return null;
    }
  }

  static _firstSentence(finalResponse) {
    const first = finalResponse.split(/[.!?\n]/)[0]?.trim();
    return first ? first.slice(0, RunSummary.MAX_CHARS) : AgentLoopText.SUMMARY_FALLBACK;
  }
}

module.exports = RunSummary;
