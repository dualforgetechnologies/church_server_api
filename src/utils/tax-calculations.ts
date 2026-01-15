/**
 * Interface for tax breakdown calculations
 * Following the decoupled tax system where:
 * 1. First tier taxes (6% total) are calculated on subtotal:
 *    - GETFund (2.5%)
 *    - NHIL (2.5%)
 *    - COVID-19 Levy (1%)
 * 2. VAT (15%) is calculated on subtotal + first tier taxes
 */
export interface TaxBreakdown {
    subtotal: number;
    getFund: number;
    nhil: number;
    // covidLevy: number
    firstTierTotal: number;
    vat: number;
    grandTotal: number;
}

/**
 * Tax rates as constants
 */
export const TAX_RATES = {
    GET_FUND: 0.025, // 2.5%
    NHIL: 0.025, // 2.5%
    // COVID_LEVY: 0.01, // 1%
    VAT: 0.15, // 15%
} as const;

/**
 * Calculates all tax components based on the subtotal
 * @param subtotal - The base amount before taxes
 * @returns TaxBreakdown object with all tax calculations
 */
export const calculateTaxes = (subtotal: number): TaxBreakdown => {
    // First tier taxes (6% total)
    const getFund = subtotal * TAX_RATES.GET_FUND;
    const nhil = subtotal * TAX_RATES.NHIL;
    // const covidLevy = subtotal * TAX_RATES.COVID_LEVY

    // Calculate total after first tier taxes
    const firstTierTotal = subtotal + getFund + nhil; // + covidLevy

    // VAT 15% on subtotal + first tier taxes
    const vat = firstTierTotal * TAX_RATES.VAT;

    // Calculate grand total
    const grandTotal = firstTierTotal + vat;

    return {
        subtotal,
        getFund,
        nhil,
        firstTierTotal,
        vat,
        grandTotal,
    };
};

/**
 * Formats a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: GHc)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'GHS'): string => {
    return `${currency}${amount.toFixed(2)}`;
};

/**
 * Validates if tax calculations are correct
 * @param breakdown - The tax breakdown to validate
 * @returns boolean indicating if calculations are valid
 */
export const validateTaxCalculations = (breakdown: TaxBreakdown): boolean => {
    const { subtotal, getFund, nhil, firstTierTotal, vat, grandTotal } = breakdown;

    // Validate first tier taxes
    const calculatedGetFund = subtotal * TAX_RATES.GET_FUND;
    const calculatedNHIL = subtotal * TAX_RATES.NHIL;
    // const calculatedCovidLevy = subtotal * TAX_RATES.COVID_LEVY

    // Validate totals
    const calculatedFirstTierTotal = subtotal + getFund + nhil; //+ covidLevy
    const calculatedVAT = calculatedFirstTierTotal * TAX_RATES.VAT;
    const calculatedGrandTotal = calculatedFirstTierTotal + calculatedVAT;

    // Check if all calculations match within a small epsilon for floating point comparison
    const epsilon = 0.01;
    return (
        Math.abs(getFund - calculatedGetFund) < epsilon &&
        Math.abs(nhil - calculatedNHIL) < epsilon &&
        // Math.abs(covidLevy - calculatedCovidLevy) < epsilon &&
        Math.abs(firstTierTotal - calculatedFirstTierTotal) < epsilon &&
        Math.abs(vat - calculatedVAT) < epsilon &&
        Math.abs(grandTotal - calculatedGrandTotal) < epsilon
    );
};

/**
 * Example usage:
 * const subtotal = 82.00
 * const taxes = calculateTaxes(subtotal)
 * console.log(taxes)
 * Output should match the invoice example:
 * {
 *   subtotal: 82.00,
 *   getFund: 2.05,    // 2.5% of 82.00
 *   nhil: 2.05,       // 2.5% of 82.00
 *   covidLevy: 0.82,  // 1% of 82.00
 *   firstTierTotal: 86.92,
 *   vat: 13.04,       // 15% of 86.92
 *   grandTotal: 100.00
 * }
 */
