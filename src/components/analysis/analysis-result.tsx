import { motion } from 'framer-motion';
import { formatCurrencyWithSymbol } from '@/lib/currency';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AnalysisResultProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  targetPrice: number;
  monthlySavings: number;
  monthsToTarget: number;
  isAffordable: boolean;
  currency: string;
}

export function AnalysisResult({
  monthlyIncome,
  monthlyExpenses,
  savings,
  targetPrice,
  monthlySavings,
  monthsToTarget,
  isAffordable,
  currency,
}: AnalysisResultProps) {
  const remainingAmount = targetPrice - savings;
  const yearsToTarget = (monthsToTarget / 12).toFixed(1);

  const formatAmount = (amount: number) => formatCurrencyWithSymbol(amount, currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>
            Based on your financial information, here's what we found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6">
            <h3 className="text-xl font-semibold">
              {isAffordable ? "Yes, you can buy it!" : "Not yet, but here's the plan"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {isAffordable
                ? "Based on your current savings and monthly income, this purchase is within your means."
                : "With some planning, you can work towards this purchase."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Monthly Savings Potential</p>
              <p className="text-2xl font-bold text-blue-500">
                {formatAmount(monthlySavings)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Time to Reach Target</p>
              <p className="text-2xl font-bold text-purple-500">
                {monthsToTarget < 1
                  ? 'Ready to buy!'
                  : `${monthsToTarget} months (${yearsToTarget} years)`}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Financial Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Price</span>
                <span className="font-mono font-medium">
                  {formatAmount(targetPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Savings</span>
                <span className="font-mono font-medium">
                  {formatAmount(savings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining Amount</span>
                <span className="font-mono font-medium">
                  {formatAmount(remainingAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Income</span>
                <span className="font-mono font-medium">
                  {formatAmount(monthlyIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Expenses</span>
                <span className="font-mono font-medium">
                  {formatAmount(monthlyExpenses)}
                </span>
              </div>
            </div>
          </div>

          {!isAffordable && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200">
                Recommendations
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-yellow-800 dark:text-yellow-200">
                <li>Consider reducing monthly expenses to increase savings</li>
                <li>Look for additional income sources</li>
                <li>Set up automatic savings transfers</li>
                <li>Research alternative products with lower prices</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
