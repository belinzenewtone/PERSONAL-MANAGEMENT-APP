import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { darkColors } from './theme';

export function getCategoryIcon(category: string) {
  const normalized = category.trim().toLowerCase();

  if (normalized.includes('food') || normalized.includes('dining') || normalized.includes('restaurant')) {
    return 'restaurant-outline';
  }
  if (normalized.includes('transport') || normalized.includes('travel') || normalized.includes('fuel')) {
    return 'car-outline';
  }
  if (normalized.includes('airtime') || normalized.includes('mobile') || normalized.includes('phone')) {
    return 'phone-portrait-outline';
  }
  if (normalized.includes('bill') || normalized.includes('utility') || normalized.includes('water') || normalized.includes('electric')) {
    return 'receipt-outline';
  }
  if (normalized.includes('shopping') || normalized.includes('fees')) {
    return 'bag-handle-outline';
  }
  if (normalized.includes('salary') || normalized.includes('income') || normalized.includes('deposit')) {
    return 'cash-outline';
  }
  if (normalized.includes('rent') || normalized.includes('home')) {
    return 'home-outline';
  }
  if (normalized.includes('cash')) {
    return 'wallet-outline';
  }
  return 'grid-outline';
}

export function CategoryIcon({
  category,
  size = 16,
  color = darkColors.accentLight,
}: {
  category: string;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={getCategoryIcon(category)} size={size} color={color} />;
}
