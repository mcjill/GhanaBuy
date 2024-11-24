'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies } from "@/lib/currency";

interface CurrencySelectProps {
  id?: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function CurrencySelect({ id, name, value, onValueChange }: CurrencySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} name={name}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code} - {currency.name} ({currency.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
