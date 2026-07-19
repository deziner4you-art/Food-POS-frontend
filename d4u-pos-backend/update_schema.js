const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// AccountGroup
schema = schema.replace(/model AccountGroup \{[\s\S]*?\}/, match => {
    let newMatch = match.replace(/budget_lines\s+BudgetLine\[\]/, 'budget_lines                 BudgetLine[]');
    // remove any mistakenly added relations
    newMatch = newMatch.replace(/\n\s*retained_earnings_transfers_source.*$/gm, '');
    newMatch = newMatch.replace(/\n\s*retained_earnings_transfers_target.*$/gm, '');
    return newMatch.replace(/\}$/, '  retained_earnings_transfers_source  RetainedEarningsTransfer[] @relation("TransferSourceGroup")\n}');
});

// Account
schema = schema.replace(/model Account \{[\s\S]*?\}/, match => {
    let newMatch = match.replace(/budget_lines\s+BudgetLine\[\]/, 'budget_lines                 BudgetLine[]');
    newMatch = newMatch.replace(/\n\s*retained_earnings_transfers_source.*$/gm, '');
    newMatch = newMatch.replace(/\n\s*retained_earnings_transfers_target.*$/gm, '');
    return newMatch.replace(/\}$/, '  retained_earnings_transfers_source  RetainedEarningsTransfer[] @relation("TransferSourceAccount")\n  retained_earnings_transfers_target  RetainedEarningsTransfer[] @relation("TransferTargetAccount")\n}');
});

// FiscalYear
schema = schema.replace(/model FiscalYear \{[\s\S]*?\}/, match => {
    if (!match.includes('YearEndClosing')) {
        return match.replace(/budgets\s+Budget\[\]/, 'budgets       Budget[]\n  YearEndClosing YearEndClosing? @relation("FiscalYearToYearEnd")');
    }
    return match;
});

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('Schema updated successfully');
