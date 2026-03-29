'use strict';

/**
 * Flexible Approval Rule Engine
 * ─────────────────────────────
 * Evaluated after every approval action to determine whether the expense
 * should be auto-approved based on company-defined rules, independent of
 * the normal sequential step flow.
 *
 * Rule types:
 *
 *  ┌──────────────┬──────────────────────────────────────────────────────────┐
 *  │ Type         │ Trigger condition                                        │
 *  ├──────────────┼──────────────────────────────────────────────────────────┤
 *  │ percentage   │ (approved steps / total steps) * 100 >= rule.value       │
 *  │              │ e.g. value=50 → half the approvers approved → done       │
 *  ├──────────────┼──────────────────────────────────────────────────────────┤
 *  │ specific     │ The approver who just acted is rule.specificApproverId   │
 *  │              │ e.g. CEO approval alone is sufficient                     │
 *  ├──────────────┼──────────────────────────────────────────────────────────┤
 *  │ hybrid       │ BOTH: specific approver acted AND percentage threshold   │
 *  │              │ is reached                                                │
 *  └──────────────┴──────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   const result = RuleEngine.evaluate(context);
 *   if (result.triggered) { ... auto-approve expense ... }
 */
class RuleEngine {
  /**
   * @param {object}   context
   * @param {object}   context.expense          - Expense instance (has .id, .amount)
   * @param {object}   context.currentApproval  - The Approval just actioned
   * @param {object[]} context.allApprovals     - All Approval rows for the expense
   * @param {object[]} context.rules            - Company's ApprovalRule rows
   *
   * @returns {{ triggered: boolean, rule: object|null, reason: string }}
   */
  static evaluate({ expense, currentApproval, allApprovals, rules }) {
    if (!rules || !rules.length) {
      return { triggered: false, rule: null, reason: 'No approval rules defined.' };
    }

    const totalSteps    = allApprovals.length;
    const approvedSteps = allApprovals.filter((a) => a.status === 'Approved').length;
    const approvedPct   = totalSteps > 0 ? (approvedSteps / totalSteps) * 100 : 0;
    const actorId       = currentApproval.approverId;

    for (const rule of rules) {
      const result = RuleEngine._evaluateRule(rule, {
        actorId,
        approvedPct,
        approvedSteps,
        totalSteps,
      });

      if (result.triggered) {
        return { triggered: true, rule, reason: result.reason };
      }
    }

    return { triggered: false, rule: null, reason: 'No rule conditions met.' };
  }

  // ── Private evaluators ─────────────────────────────────────────────────────

  static _evaluateRule(rule, { actorId, approvedPct, approvedSteps, totalSteps }) {
    switch (rule.type) {
      case 'percentage':
        return RuleEngine._evalPercentage(rule, approvedPct, approvedSteps, totalSteps);

      case 'specific':
        return RuleEngine._evalSpecific(rule, actorId);

      case 'hybrid':
        return RuleEngine._evalHybrid(rule, actorId, approvedPct, approvedSteps, totalSteps);

      default:
        return { triggered: false, reason: `Unknown rule type: ${rule.type}` };
    }
  }

  /**
   * Percentage rule:
   * Triggered when the percentage of Approved steps >= rule.value.
   */
  static _evalPercentage(rule, approvedPct, approvedSteps, totalSteps) {
    const threshold = parseFloat(rule.value);
    if (isNaN(threshold)) {
      return { triggered: false, reason: 'Percentage rule has no threshold value.' };
    }

    if (approvedPct >= threshold) {
      return {
        triggered: true,
        reason: `Percentage rule met: ${approvedSteps}/${totalSteps} approved (${approvedPct.toFixed(1)}% >= ${threshold}%).`,
      };
    }
    return {
      triggered: false,
      reason: `Percentage rule not met: ${approvedPct.toFixed(1)}% < ${threshold}%.`,
    };
  }

  /**
   * Specific approver rule:
   * Triggered immediately when the specific designated user has approved.
   */
  static _evalSpecific(rule, actorId) {
    if (!rule.specificApproverId) {
      return { triggered: false, reason: 'Specific rule has no specificApproverId set.' };
    }

    if (Number(actorId) === Number(rule.specificApproverId)) {
      return {
        triggered: true,
        reason: `Specific approver rule met: user #${actorId} is the designated key approver.`,
      };
    }
    return {
      triggered: false,
      reason: `Specific rule not met: actor #${actorId} is not the designated approver #${rule.specificApproverId}.`,
    };
  }

  /**
   * Hybrid rule:
   * Triggered only when BOTH the specific approver has acted AND the
   * percentage threshold has been reached.
   */
  static _evalHybrid(rule, actorId, approvedPct, approvedSteps, totalSteps) {
    const specificResult = RuleEngine._evalSpecific(rule, actorId);
    const pctResult      = RuleEngine._evalPercentage(rule, approvedPct, approvedSteps, totalSteps);

    if (specificResult.triggered && pctResult.triggered) {
      return {
        triggered: true,
        reason: `Hybrid rule met: ${specificResult.reason} AND ${pctResult.reason}`,
      };
    }
    return {
      triggered: false,
      reason: `Hybrid rule not met. Specific: ${specificResult.triggered}, Percentage: ${pctResult.triggered}.`,
    };
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  /**
   * Summarise all rule evaluations for debug/audit purposes.
   *
   * @param {object} context - Same as evaluate()
   * @returns {object[]} Array of { ruleId, type, triggered, reason }
   */
  static audit({ expense, currentApproval, allApprovals, rules }) {
    if (!rules || !rules.length) return [];

    const totalSteps    = allApprovals.length;
    const approvedSteps = allApprovals.filter((a) => a.status === 'Approved').length;
    const approvedPct   = totalSteps > 0 ? (approvedSteps / totalSteps) * 100 : 0;
    const actorId       = currentApproval.approverId;

    return rules.map((rule) => {
      const result = RuleEngine._evaluateRule(rule, {
        actorId,
        approvedPct,
        approvedSteps,
        totalSteps,
      });
      return { ruleId: rule.id, type: rule.type, ...result };
    });
  }
}

module.exports = RuleEngine;
