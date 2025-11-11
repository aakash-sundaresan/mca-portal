"""
AOC-4 Complete Extraction System with Improved Mapping Validation

FIXES:
- Validates that mapped cells are unprotected (is_protected = False)
- Auto-corrects mappings that point to protected cells
- Better prompt emphasizing unprotected cell selection
- Handles negative numbers correctly in calculations
"""

import json
import boto3
import re
import os
from typing import Dict, Any, List
from config import (
    BEDROCK_MODEL_ID, MAX_TOKENS, TEMPERATURE,
    CHUNK_SIZE, CHUNK_OVERLAP
)
from utils.logger import log_info, log_error
import time

bedrock_client = boto3.client('bedrock-runtime')

# Cache directory
CACHE_DIR = "/tmp/aoc4_cache"
MAPPING_FILE = os.path.join(CACHE_DIR, "field_to_cell_mapping.json")
os.makedirs(CACHE_DIR, exist_ok=True)

PREDEFINED_FIELDS = {
    # Balance Sheet - Equity and Liabilities - Shareholder's Fund
    "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.shareHoldersFund.reservesAndSurplus": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.shareHoldersFund.moneyRecievedAgainestShareWarrants": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.shareApplicationMoneyPendingAllotment": {"type": "numeric", "default": 0},
    
    # Balance Sheet - Non-Current Liabilities
    "balanceSheet.equityAndLiabilities.nonLiabilities.longTermBorrowings": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.nonLiabilities.deferredTaxLiabilities": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.nonLiabilities.otherLongTermLiabilities": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.nonLiabilities.longTermProvisions": {"type": "numeric", "default": 0},
    
    # Balance Sheet - Current Liabilities
    "balanceSheet.equityAndLiabilities.Liabilities.shortTermBorrowings": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.Liabilities.tradePayables.totaloutstandingduesMicroSmallEntYear": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.Liabilities.tradePayables.totaloutduesOtherthanMicroSmallEntYear": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.Liabilities.otherLiabilities": {"type": "numeric", "default": 0},
    "balanceSheet.equityAndLiabilities.Liabilities.shortTermProvisions": {"type": "numeric", "default": 0},
    
    # Balance Sheet - Non-Current Assets
    "balanceSheet.assets.nonAssets.propertyPlantAndEquipments": {"type": "numeric", "default": 0},
    "balanceSheet.assets.nonAssets.intangibleAssets": {"type": "numeric", "default": 0},
    "balanceSheet.assets.nonAssets.capitalWorkInProgress": {"type": "numeric", "default": 0},
    "balanceSheet.assets.nonAssets.intangibleAssetsUnderDevelopment": {"type": "numeric", "default": 0},
    "balanceSheet.assets.nonAssets.nonInvestments": {"type": "numeric", "default": 0},
    "balanceSheet.assets.nonAssets.deferredTaxAssets": {"type": "numeric", "default": 0},
    "balanceSheet.assets.nonAssets.longTermLoansandAdvances": {"type": "numeric", "default": 0},
    "balanceSheet.assets.nonAssets.otherNonAssets": {"type": "numeric", "default": 0},
    
    # Balance Sheet - Current Assets
    "balanceSheet.assets.Assets.Investment": {"type": "numeric", "default": 0},
    "balanceSheet.assets.Assets.inventories": {"type": "numeric", "default": 0},
    "balanceSheet.assets.Assets.tradeReceivables": {"type": "numeric", "default": 0},
    "balanceSheet.assets.Assets.cashAndCashEquivalents": {"type": "numeric", "default": 0},
    "balanceSheet.assets.Assets.shortTermLoansAndAdvances": {"type": "numeric", "default": 0},
    "balanceSheet.assets.Assets.otherAssets": {"type": "numeric", "default": 0},
    
    # Breakup of Balance Sheet - Long Term Borrowings Unsecured
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.bondsDebentures": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.termLoansFromBank": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.termLoansFromOtherParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.deferredPaymentLiabilities": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.deposits": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.loansandAdvancesFromRelatedParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.longTermMaturitiesOfFinanceLeaseObligations": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.otherLoansAdvances": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfLongTermBorrowingsUnsercured.aggregateAmountGuaranteedbyDirectors": {"type": "numeric", "default": 0},
    
    # Breakup of Balance Sheet - Short Term Borrowings Unsecured
    "breakupofBalanceSheet.detailOfShortTermBorrowingsUnsecured.loansRepayableFromBank": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfShortTermBorrowingsUnsecured.loansRepayableFromOtherParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfShortTermBorrowingsUnsecured.loansFromRelatedParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfShortTermBorrowingsUnsecured.deposits": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfShortTermBorrowingsUnsecured.otherLoans": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailOfShortTermBorrowingsUnsecured.aggregateAmountGuaranteedbyDirectors": {"type": "numeric", "default": 0},
    
    # Breakup of Balance Sheet - Long Term Loans Unsecured Considered Good
    "breakupofBalanceSheet.detailsOfLongTermLoansUnsecuredConsideredGood.capitalAdvances": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansUnsecuredConsideredGood.loansToRelatedParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansUnsecuredConsideredGood.otherLoans": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansUnsecuredConsideredGood.fromRelatedParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansUnsecuredConsideredGood.fromOthers": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansUnsecuredConsideredGood.loansDueByDirectors": {"type": "numeric", "default": 0},
    
    # Breakup of Balance Sheet - Long Term Loans Doubtful
    "breakupofBalanceSheet.detailsOfLongTermLoansDoubtful.capitalAdvances": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansDoubtful.loansToRelatedParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansDoubtful.otherLoans": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansDoubtful.ProvisionforBadLoansfromRelatedParties": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansDoubtful.ProvisionforBadLoansfromOthers": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfLongTermLoansDoubtful.loansDueByDirectors": {"type": "numeric", "default": 0},
    
    # Breakup of Balance Sheet - Trade Receivables
    "breakupofBalanceSheet.detailsOfTradeReceivables.securedConsideredGood": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfTradeReceivables.unsecuredConsideredGood": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfTradeReceivables.doubtful": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfTradeReceivables.provisionForDoubtfulDebts": {"type": "numeric", "default": 0},
    "breakupofBalanceSheet.detailsOfTradeReceivables.debtDueByDirectors": {"type": "numeric", "default": 0},
    
    # Financial Parameters
    "financialParameters.amountOfIssueAlloted": {"type": "numeric", "default": 0},
    "financialParameters.shareApplicationMoneyGiven": {"type": "numeric", "default": 0},
    "financialParameters.shareApplicationMoneyGivenDuringReportingPeriod": {"type": "numeric", "default": 0},
    "financialParameters.shareApplicationMoneyReceived": {"type": "numeric", "default": 0},
    "financialParameters.shareApplicationMoneyReceivedDuringReportingPeriod": {"type": "numeric", "default": 0},
    "financialParameters.paidUpCapitalHeldByFC": {"type": "numeric", "default": 0},
    "financialParameters.paidUpCapitalHeldByFHC": {"type": "numeric", "default": 0},
    "financialParameters.numberOfSharesBoughtBackDuringReportingPeriod": {"type": "numeric", "default": 0},
    "financialParameters.depositAcceptedDuringReportingPeriod": {"type": "numeric", "default": 0},
    "financialParameters.depositsMaturedNotPaidinReportingPeriod": {"type": "numeric", "default": 0},
    "financialParameters.depositsMaturedButNotPaid": {"type": "numeric", "default": 0},
    "financialParameters.depositsMaturedButNotClaimed": {"type": "numeric", "default": 0},
    "financialParameters.unclaimedMaturedDebentures": {"type": "numeric", "default": 0},
    "financialParameters.debenturesClaimedButNotPaid": {"type": "numeric", "default": 0},
    "financialParameters.interestAccruedAndDueNotPaid": {"type": "numeric", "default": 0},
    "financialParameters.unpaidDividend": {"type": "numeric", "default": 0},
    "financialParameters.investmentInSubsidiaryCompanies": {"type": "numeric", "default": 0},
    "financialParameters.investmentInGovernmentCompanies": {"type": "numeric", "default": 0},
    "financialParameters.capitalReserves": {"type": "numeric", "default": 0},
    "financialParameters.amountDueForTransferToIEPF": {"type": "numeric", "default": 0},
    "financialParameters.intercorporateDeposits": {"type": "numeric", "default": 0},
    "financialParameters.grossValueOfTransactionAsPerAS18": {"type": "numeric", "default": 0},
    "financialParameters.capitalSubsidies": {"type": "numeric", "default": 0},
    "financialParameters.callsUnpaidByDirectors": {"type": "numeric", "default": 0},
    "financialParameters.callsUnpaidByOthers": {"type": "numeric", "default": 0},
    "financialParameters.forfittedShares": {"type": "numeric", "default": 0},
    "financialParameters.forfittedSharesReissued": {"type": "numeric", "default": 0},
    "financialParameters.borrowingFromForeignInstitutionalAgencies": {"type": "numeric", "default": 0},
    "financialParameters.borrowingFromFC": {"type": "numeric", "default": 0},
    "financialParameters.securedIntercorporateBorrowings": {"type": "numeric", "default": 0},
    "financialParameters.unSecuredIntercorporateBorrowings": {"type": "numeric", "default": 0},
    "financialParameters.commercialPaper": {"type": "numeric", "default": 0},
    "financialParameters.conversionOfWarrantsInToEquityShares": {"type": "numeric", "default": 0},
    "financialParameters.conversionOfWarrantsInToPrefrenceShares": {"type": "numeric", "default": 0},
    "financialParameters.conversionOfWarrantsInToDebentures": {"type": "numeric", "default": 0},
    "financialParameters.warrantsIssuedInForeignCurrency": {"type": "numeric", "default": 0},
    "financialParameters.warrantsIssuedInRupees": {"type": "numeric", "default": 0},
    "financialParameters.defaultInPaymentOfShortTermBorrowings": {"type": "numeric", "default": 0},
    "financialParameters.defaultInPaymentOfLongTermBorrowings": {"type": "numeric", "default": 0},
    "financialParameters.operatingLeaseHasBeenConverted": {"type": "numeric", "default": ""},
    "financialParameters.netWorthOfCompany": {"type": "numeric", "default": 0},
    "financialParameters.numberOfShareholderstoWhomeSharesAllotted": {"type": "numeric", "default": 0},
    "financialParameters.securedLoan": {"type": "numeric", "default": 0},
    "financialParameters.grossPropertyPlantsAssets": {"type": "numeric", "default": 0},
    "financialParameters.depreciationAndAmortization": {"type": "numeric", "default": 0},
    "financialParameters.MiscellaneousexpenditureToTheExtentNotAdjuested": {"type": "numeric", "default": 0},
    "financialParameters.unhedgedForeignExchangeExposure": {"type": "numeric", "default": 0},
    
    # Raised Share Capital - Equity Shares - Beginning of Year
    "raisedShareCapital.equityShare.atTheBeginningOfTheYearNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.atTheBeginningOfTheYearTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.atTheBeginningOfTheYearTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.atTheBeginningOfTheYearTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Public Issue
    "raisedShareCapital.equityShare.increaseAmount.publicIssueNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.publicIssueTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.publicIssueTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.publicIssueTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Right Issue
    "raisedShareCapital.equityShare.increaseAmount.rightIssueNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.rightIssueTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.rightIssueTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.rightIssueTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Bonus Issue
    "raisedShareCapital.equityShare.increaseAmount.bonusIssueNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.bonusIssueTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.bonusIssueTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.bonusIssueTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Private Placement
    "raisedShareCapital.equityShare.increaseAmount.privatePlacementNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.privatePlacementTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.privatePlacementTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.privatePlacementTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - ESOPs
    "raisedShareCapital.equityShare.increaseAmount.esopsNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.esopsTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.esopsTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.esopsTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Sweat Share Alloted
    "raisedShareCapital.equityShare.increaseAmount.sweatShareAllotedNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.sweatShareAllotedTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.sweatShareAllotedTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.sweatShareAllotedTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Conversion of Preference Share
    "raisedShareCapital.equityShare.increaseAmount.conversionOfPreferenceShareNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.conversionOfPreferenceShareTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.conversionOfPreferenceShareTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.conversionOfPreferenceShareTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Conversion of Debentures
    "raisedShareCapital.equityShare.increaseAmount.conversionOfDebenturesNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.conversionOfDebenturesTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.conversionOfDebenturesTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.conversionOfDebenturesTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - GDRs
    "raisedShareCapital.equityShare.increaseAmount.gdrsNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.gdrsTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.gdrsTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.increaseAmount.gdrsTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Increases - Others
    "raisedShareCapital.equityShare.increaseAmount.othersNumberOfShares": {"type": "numeric", "default": ""},
    "raisedShareCapital.equityShare.increaseAmount.othersTotalNominalAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.equityShare.increaseAmount.othersTotalPaidupAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.equityShare.increaseAmount.othersTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Decreases - Buy Back Shares
    "raisedShareCapital.equityShare.decreaseAmount.buyBackSharesNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.buyBackSharesTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.buyBackSharesTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.buyBackSharesTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Decreases - Shares Forfeited
    "raisedShareCapital.equityShare.decreaseAmount.sharesForfeitedNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.sharesForfeitedTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.sharesForfeitedTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.sharesForfeitedTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Decreases - Reduction of Share Capital
    "raisedShareCapital.equityShare.decreaseAmount.reductionOfShareCapitalNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.reductionOfShareCapitalTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.reductionOfShareCapitalTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.equityShare.decreaseAmount.reductionOfShareCapitalTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Equity Shares - Decreases - Others
    "raisedShareCapital.equityShare.decreaseAmount.othersNumberOfShares": {"type": "numeric", "default": ""},
    "raisedShareCapital.equityShare.decreaseAmount.othersTotalNominalAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.equityShare.decreaseAmount.othersTotalPaidupAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.equityShare.decreaseAmount.othersTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Beginning of Year
    "raisedShareCapital.preferenceShare.atTheBeginningOfTheYearNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.atTheBeginningOfTheYearTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.atTheBeginningOfTheYearTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.atTheBeginningOfTheYearTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Increases - Issue of Share
    "raisedShareCapital.preferenceShare.increaseAmount.issueOfShareNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.increaseAmount.issueOfShareTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.increaseAmount.issueOfShareTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.increaseAmount.issueOfShareTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Increases - Reissue Forfeited Share
    "raisedShareCapital.preferenceShare.increaseAmount.reissueForfeitedShareNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.increaseAmount.reissueForfeitedShareTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.increaseAmount.reissueForfeitedShareTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.increaseAmount.reissueForfeitedShareTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Increases - Others
    "raisedShareCapital.preferenceShare.increaseAmount.othersNumberOfShares": {"type": "numeric", "default": ""},
    "raisedShareCapital.preferenceShare.increaseAmount.othersTotalNominalAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.preferenceShare.increaseAmount.othersTotalPaidupAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.preferenceShare.increaseAmount.othersTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Decreases - Redemption
    "raisedShareCapital.preferenceShare.decreaseAmount.redemptionNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.redemptionTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.redemptionTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.redemptionTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Decreases - Shares Forfeited
    "raisedShareCapital.preferenceShare.decreaseAmount.sharesForfeitedNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.sharesForfeitedTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.sharesForfeitedTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.sharesForfeitedTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Decreases - Reduction of Share Capital
    "raisedShareCapital.preferenceShare.decreaseAmount.reductionOfShareCapitalNumberOfShares": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.reductionOfShareCapitalTotalNominalAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.reductionOfShareCapitalTotalPaidupAmount": {"type": "numeric", "default": 0},
    "raisedShareCapital.preferenceShare.decreaseAmount.reductionOfShareCapitalTotalPremium": {"type": "numeric", "default": ""},
    
    # Raised Share Capital - Preference Shares - Decreases - Others
    "raisedShareCapital.preferenceShare.decreaseAmount.othersNumberOfShares": {"type": "numeric", "default": ""},
    "raisedShareCapital.preferenceShare.decreaseAmount.othersTotalNominalAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.preferenceShare.decreaseAmount.othersTotalPaidupAmount": {"type": "numeric", "default": ""},
    "raisedShareCapital.preferenceShare.decreaseAmount.othersTotalPremium": {"type": "numeric", "default": ""},
    
    # Statement of Profit and Loss - Revenue
    "statementOfProfitAndLoss.DomesticsaleOfGoodsManufactured": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.DomesticsaleOfGoodsTraded": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.DomesticsaleOrSupplyOfServices": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.ExportsaleOfGoodsManufactured": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.ExportsaleOfGoodsTraded": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.ExportsaleOrSupplyOfServices": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.Other.DividendIncome": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.Other.InterestIncome": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.otherIncome.netGainLossOnSaleOfInvestments": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.otherIncome.otherNonOperatingIncome": {"type": "numeric", "default": 0},
    
    # Statement of Profit and Loss - Expenses
    "statementOfProfitAndLoss.expenses.costOfMaterialsConsumed": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.purchasesOfStockInTrade": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.changesInInventories.finishedGoods": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.changesInInventories.workInProgress": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.changesInInventories.stockInTrade": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.employeeBenefitExpenses": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.managerialRemuneration": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.paymentToAuditors": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.insuranceExpenses": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.powerAndFuel": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.financeCost": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.depreciationAndAmortizationExpenses": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.expenses.otherExpenses": {"type": "numeric", "default": 0},
    
    # Statement of Profit and Loss - Profit Calculations
    "statementOfProfitAndLoss.exceptionalItems": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.extraordinaryItems": {"type": "numeric", "default": 0},
    
    # Statement of Profit and Loss - Tax Expense
    "statementOfProfitAndLoss.taxExpense.CurrentTax": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.taxExpense.deferredTax": {"type": "numeric", "default": 0},
    
    # Statement of Profit and Loss - Profit/Loss
    "statementOfProfitAndLoss.profitLossFromDiscontinuingOperations": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.taxExpenseOfDiscontinuingOperations": {"type": "numeric", "default": 0},
    
    # Statement of Profit and Loss - Earnings Per Share
    "statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.basic": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.diluted": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.earningsPerEquityShareAfterExtraordinaryItems.basic": {"type": "numeric", "default": 0},
    "statementOfProfitAndLoss.earningsPerEquityShareAfterExtraordinaryItems.diluted": {"type": "numeric", "default": 0},
    
    # Detailed Profit and Loss - Earning in Foreign Exchange
    "detailedProfitAndLoss.earningInForeignExchange.exportOfGoodsCalculatedOnFOB": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.earningInForeignExchange.interestAndDividend": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.earningInForeignExchange.royalty": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.earningInForeignExchange.knowHow": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.earningInForeignExchange.professionalAndConsultation": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.earningInForeignExchange.otherIncome": {"type": "numeric", "default": 0},
    
    # Detailed Profit and Loss - Expenditure in Foreign Exchange - Import of Goods
    "detailedProfitAndLoss.expenditureInForeignExchange.importOfGoodsCalculatedOnCIFBasis.rawMaterial": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.expenditureInForeignExchange.importOfGoodsCalculatedOnCIFBasis.componentAndSpareParts": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.expenditureInForeignExchange.importOfGoodsCalculatedOnCIFBasis.capitalGoods": {"type": "numeric", "default": 0},
    
    # Detailed Profit and Loss - Expenditure in Foreign Exchange - Expenditure on Account
    "detailedProfitAndLoss.expenditureInForeignExchange.expenditureOnAccount.royalty": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.expenditureInForeignExchange.expenditureOnAccount.knowHow": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.expenditureInForeignExchange.expenditureOnAccount.professionalAndConsultation": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.expenditureInForeignExchange.expenditureOnAccount.interest": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.expenditureInForeignExchange.expenditureOnAccount.otherMatters": {"type": "numeric", "default": 0},
    "detailedProfitAndLoss.expenditureInForeignExchange.expenditureOnAccount.dividendPaid": {"type": "numeric", "default": 0},
    
    # Financial Parameters - Profit and Loss Items
    "financialParameters.profitAndLossItems.proposedDividend": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.proposedDividendPercentage": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.earningsPerShare.basic": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.earningsPerShare.diluted": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.incomeInForeignCurrency": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.expenditureInForeignCurrency": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.revenueSubsidiesOrGrantsReceivedFromGovernmentAuthorities": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.rentPaid": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.consumptionOfStoresAndSpareParts": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.grossValueOfTransactionWithRelatedPartiesAsPerAS18": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.badDebtsOfRelatedPartiesAsPerAS18": {"type": "numeric", "default": 0},
    "financialParameters.profitAndLossItems.contributionMadeUnderSubSection3OfSection182": {"type": "numeric", "default": 0},
}


def _invoke_bedrock(prompt: str) -> str:
    """Invoke Bedrock"""
    start_time = time.time()
    
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "messages": [{"role": "user", "content": prompt}]
    }
    
    try:
        log_info(f"Invoking Bedrock (prompt: {len(prompt):,} chars)")
        
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        content = response_body['content'][0]['text']
        elapsed = time.time() - start_time
        
        log_info(f"Response in {elapsed:.1f}s ({len(content):,} chars)")
        return content
        
    except Exception as e:
        log_error(f"Bedrock failed: {str(e)}")
        raise


def _extract_json(text: str) -> dict:
    """Extract JSON from AI response"""
    try:
        clean_text = text
        if '```json' in text:
            clean_text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            parts = text.split('```')
            if len(parts) >= 3:
                clean_text = parts[1]
        
        start = clean_text.find('{')
        end = clean_text.rfind('}') + 1
        
        if start == -1:
            return {}
        
        json_str = clean_text[start:end].strip() if end > start else clean_text[start:].strip()
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)  # Remove trailing commas
        
        return json.loads(json_str)
        
    except Exception as e:
        log_error(f"JSON parse error: {str(e)}")
        return {}


# ============================================================================
# PASS 1: Extract Values from Data File
# ============================================================================

def extract_field_values_from_document(document_text: str) -> Dict[str, Any]:
    """
    PASS 1: Extract field values from AOC-4 document
    
    Args:
        document_text: The extracted text from AOC-4 PDF
    
    Returns:
        Dict of {field_path: extracted_value}
        Example: {"balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": 2500000.0}
    """
    log_info("=" * 80)
    log_info("PASS 1: EXTRACT VALUES FROM DATA FILE")
    log_info("=" * 80)
    log_info(f"Document length: {len(document_text):,} chars")
    log_info(f"Total fields to extract: {len(PREDEFINED_FIELDS)}")
    
    # Initialize ALL fields with defaults
    extracted_values = {
        field_path: field_config["default"]
        for field_path, field_config in PREDEFINED_FIELDS.items()
    }
    log_info(f"✓ Initialized {len(extracted_values)} fields with default values")
    
    # Process document in chunks
    chunk_num = 0
    doc_position = 0
    fields_found = 0
    
    while doc_position < len(document_text):
        chunk_num += 1
        chunk_end = min(doc_position + CHUNK_SIZE, len(document_text))
        chunk_text = document_text[doc_position:chunk_end]
        
        log_info(f"\n--- Chunk {chunk_num} ({len(chunk_text):,} chars) ---")
        
        # AI extracts values from chunk
        prompt = f"""Extract financial data from this AOC-4 document chunk.

DOCUMENT CHUNK:
{chunk_text}

FIELD DEFINITIONS (extract values for any fields present in chunk):
{json.dumps(list(PREDEFINED_FIELDS.keys()), indent=2)}

EXTRACTION RULES:

🔍 SEMANTIC MATCHING:
- Field names in document may differ from field paths
- Match by MEANING and CONTEXT, not exact text
- Example: "shareCapital" matches "Share Capital", "Equity Share Capital", "Capital Stock"
- Example: "tradeReceivables" matches "Trade Receivables", "Sundry Debtors", "Accounts Receivable"

📊 UNDERSTAND FINANCIAL STRUCTURE:
- Balance Sheet sections (Assets, Liabilities, Equity)
- P&L sections (Revenue, Expenses)
- Share Capital movements (Increases, Decreases)
- Use row labels and headers for context

💰 NUMERIC EXTRACTION:
- Extract exact numbers: "1,50,000" → 150000.00
- Handle negatives: "(25,000)" → -25000.00
- Remove commas, currency symbols
- Round to 2 decimal places

📅 PERIOD AWARENESS:
- Extract current year values by default
- Handle "Current" vs "Previous" columns

OUTPUT:
Return ONLY valid JSON mapping field_path → extracted_value:
{{
  "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": 2500000.00,
  "balanceSheet.assets.Assets.tradeReceivables": 450000.00
}}

Only include fields found in this chunk. Return {{}} if no fields found.
No explanations. No markdown.
"""
        
        try:
            response = _invoke_bedrock(prompt)
            chunk_results = _extract_json(response)
            
            if chunk_results:
                # Round and merge
                for field_path, value in chunk_results.items():
                    if field_path not in extracted_values:
                        continue
                    
                    if isinstance(value, (int, float)):
                        value = round(float(value), 2)
                    
                    old_value = extracted_values[field_path]
                    if old_value in (0, "", None) and value not in (0, "", None):
                        extracted_values[field_path] = value
                        fields_found += 1
                        log_info(f"  ✓ {field_path}: {value}")
        
        except Exception as e:
            log_error(f"Chunk {chunk_num} failed: {str(e)}")
        
        # Advance position
        if chunk_end >= len(document_text):
            break
        doc_position = chunk_end - CHUNK_OVERLAP
        if doc_position <= 0 or doc_position >= chunk_end:
            doc_position = chunk_end
        
        if chunk_num >= 100:
            log_error(f"Safety limit: stopped after {chunk_num} chunks")
            break
    
    # Summary
    log_info(f"\n{'='*80}")
    log_info(f"✓ PASS 1 COMPLETE: VALUE EXTRACTION")
    log_info(f"{'='*80}")
    log_info(f"Total fields: {len(extracted_values)}")
    log_info(f"Fields with values: {fields_found}")
    log_info(f"Fields with defaults: {len(extracted_values) - fields_found}")
    
    return extracted_values


# ============================================================================
# PASS 2: Extract Cell Addresses from Template (ONE-TIME, CACHEABLE)
# ============================================================================

def generate_field_to_cell_mapping(template_data: dict, force_regenerate: bool = False) -> Dict[str, str]:
    """
    PASS 2: Generate field_path → cell_address mapping from template
    
    This is a ONE-TIME operation. The mapping is cached and reused.
    
    Args:
        template_data: Dict of {cell: [value, is_protected]}
        force_regenerate: If True, regenerate even if cache exists
    
    Returns:
        Dict of {field_path: cell_address}
        Example: {"balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": "M201"}
    """
    log_info("=" * 80)
    log_info("PASS 2: EXTRACT CELL ADDRESSES FROM TEMPLATE")
    log_info("=" * 80)
    
    # Check cache
    if not force_regenerate and os.path.exists(MAPPING_FILE):
        log_info(f"✓ Loading cached mapping from {MAPPING_FILE}")
        with open(MAPPING_FILE, 'r') as f:
            mapping = json.load(f)
        log_info(f"✓ Loaded {len(mapping)} field-to-cell mappings")
        return mapping
    
    log_info("Generating new field-to-cell mapping...")
    log_info(f"Template has {len(template_data)} cells")
    log_info(f"Fields to map: {len(PREDEFINED_FIELDS)}")
    
    # Group template by rows for context
    grouped_template = {}
    for cell, (value, is_protected) in template_data.items():
        match = re.search(r'(\d+)', cell)
        if match:
            row_num = int(match.group(1))
            if row_num not in grouped_template:
                grouped_template[row_num] = {}
            grouped_template[row_num][cell] = [value, is_protected]
    
    log_info(f"Template has {len(grouped_template)} rows")
    
    # Process fields in batches
    complete_mapping = {}
    batch_size = 50
    field_list = list(PREDEFINED_FIELDS.keys())
    
    for batch_num in range(0, len(field_list), batch_size):
        batch_fields = field_list[batch_num:batch_num + batch_size]
        
        log_info(f"\n--- Batch {batch_num//batch_size + 1}: {len(batch_fields)} fields ---")
        
        prompt = f"""Map field definitions to Excel template cell addresses.

FIELD DEFINITIONS (find cell address for each):
{json.dumps(batch_fields, indent=2)}

TEMPLATE STRUCTURE (all rows with cells and values):
{json.dumps(grouped_template, indent=2)}

CRITICAL UNDERSTANDING OF TEMPLATE FORMAT:
- Each cell is shown as: "cell_address": [value, is_protected]
- is_protected = True  → This is a LABEL/HEADER cell (READ ONLY - DO NOT USE)
- is_protected = False → This is a DATA ENTRY cell (USE THIS FOR DATA)

YOUR TASK:
For each field definition, find the UNPROTECTED CELL (is_protected = False) where data should go.

MAPPING STRATEGY:

1. FIND THE CORRECT ROW:
   - Search for the row containing the field's label
   - Example: For "netWorthOfCompany", find row with "Net Worth" label

2. IDENTIFY THE DATA CELL (CRITICAL STEP):
   - In that row, find cells where is_protected = False
   - These are the data entry cells
   - IGNORE cells where is_protected = True (those are just labels)
   
3. DETAILED EXAMPLE:

Row 371 in template:
{{
  "G371": ["Net Worth of the company", True],     ← is_protected=True (LABEL)
  "M371": ["", False],                            ← is_protected=False (DATA CELL)
  "N371": ["", False]                             ← is_protected=False (DATA CELL)
}}

Field: "financialParameters.netWorthOfCompany"

Analysis:
- G371 has is_protected=True → This is the LABEL "Net Worth of the company"
- M371 has is_protected=False → This is a DATA ENTRY cell (current year)
- N371 has is_protected=False → This is a DATA ENTRY cell (previous year)

✓ CORRECT: Return "M371" (first unprotected cell)
✗ WRONG: Return "G371" (that's protected - it's the label!)

4. MULTIPLE DATA COLUMNS:

When a row has multiple unprotected cells:
- First unprotected cell → Current Year data
- Second unprotected cell → Previous Year data
- Choose based on field context, default to first

5. SEMANTIC MATCHING:
   - Field names may differ from template labels
   - "shareCapital" matches "Share Capital", "Equity Share Capital"
   - "reservesAndSurplus" matches "Reserves and Surplus", "Reserves & Surplus"
   - "tradeReceivables" matches "Trade Receivables", "Sundry Debtors"
   - Match by financial meaning, not exact text

6. VERIFICATION CHECKLIST (MUST VERIFY BEFORE RETURNING):
   ✓ Is is_protected = False for the cell I'm returning?
   ✓ Is the cell in the correct row (matching the field label)?
   ✓ Is it a data entry cell, NOT a label cell?
   ✓ Does the column position make sense?

OUTPUT FORMAT:
{{
  "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": "M201",
  "financialParameters.netWorthOfCompany": "M371",
  "statementOfProfitAndLoss.expenses.employeeBenefitExpenses": "N402"
}}

CRITICAL RULES:
- Return ONLY cells where is_protected = False
- NEVER EVER return cells where is_protected = True
- Return exact cell addresses (e.g., "M371", "AB45")
- Only map fields you can confidently locate
- Skip fields if uncertain
- Return {{}} if no confident mappings

Return ONLY valid JSON. No explanations. No markdown.
"""
        
        try:
            response = _invoke_bedrock(prompt)
            batch_mapping = _extract_json(response)
            
            if batch_mapping:
                # VALIDATION: Check that mapped cells are unprotected
                validated_mapping = {}
                rejected_count = 0
                corrected_count = 0
                
                for field_path, cell_address in batch_mapping.items():
                    if cell_address in template_data:
                        value, is_protected = template_data[cell_address]
                        
                        if not is_protected:
                            # Good - it's an unprotected cell
                            validated_mapping[field_path] = cell_address
                        else:
                            # Bad - AI mapped to a protected cell (label)
                            rejected_count += 1
                            log_error(f"    ✗ REJECTED: {field_path} → {cell_address} (protected cell)")
                            
                            # Try to auto-correct by finding unprotected cell in same row
                            match = re.search(r'([A-Z]+)(\d+)', cell_address)
                            if match:
                                col_letter = match.group(1)
                                row_num = match.group(2)
                                
                                # Look for unprotected cells in the same row
                                for candidate_cell, (val, protected) in template_data.items():
                                    if candidate_cell.endswith(row_num) and not protected:
                                        validated_mapping[field_path] = candidate_cell
                                        corrected_count += 1
                                        log_info(f"    ✓ AUTO-CORRECTED: {field_path} → {candidate_cell}")
                                        break
                    else:
                        log_error(f"    ✗ Cell {cell_address} not found in template")
                
                complete_mapping.update(validated_mapping)
                log_info(f"  ✓ Mapped {len(validated_mapping)} fields")
                
                if rejected_count > 0:
                    log_info(f"  ⚠ Rejected {rejected_count} protected cells")
                if corrected_count > 0:
                    log_info(f"  ✓ Auto-corrected {corrected_count} mappings")
        
        except Exception as e:
            log_error(f"  ✗ Batch {batch_num//batch_size + 1} failed: {str(e)}")
    
    # Summary
    log_info(f"\n{'='*80}")
    log_info(f"✓ PASS 2 COMPLETE: CELL ADDRESS MAPPING")
    log_info(f"{'='*80}")
    log_info(f"Total fields: {len(PREDEFINED_FIELDS)}")
    log_info(f"Successfully mapped: {len(complete_mapping)}")
    log_info(f"Unmapped: {len(PREDEFINED_FIELDS) - len(complete_mapping)}")
    
    # Show unmapped
    unmapped = set(PREDEFINED_FIELDS.keys()) - set(complete_mapping.keys())
    if unmapped:
        log_info(f"\nUnmapped fields ({len(unmapped)}):")
        for field in list(unmapped)[:10]:
            log_info(f"  - {field}")
        if len(unmapped) > 10:
            log_info(f"  ... and {len(unmapped) - 10} more")
    
    # Save to cache
    with open(MAPPING_FILE, 'w') as f:
        json.dump(complete_mapping, f, indent=2)
    log_info(f"\n✓ Saved mapping to {MAPPING_FILE}")
    
    return complete_mapping


# ============================================================================
# PASS 3: Combine Both JSONs (NO AI, PURE CODE)
# ============================================================================

def combine_values_and_mapping(extracted_values: Dict[str, Any], 
                               field_to_cell_mapping: Dict[str, str]) -> Dict[str, Any]:
    """
    PASS 3: Combine extracted values with cell mapping
    
    This is INSTANT - no AI needed, just dictionary lookup.
    """
    log_info("=" * 80)
    log_info("PASS 3: COMBINE VALUES + MAPPING (NO AI)")
    log_info("=" * 80)
    
    cell_values = {}
    mapped_count = 0
    value_count = 0
    unmapped_with_values = []
    
    for field_path, value in extracted_values.items():
        # Count fields with actual values (include negatives and zero!)
        if value not in ("", None):
            value_count += 1
        
        # Try to map to cell
        if field_path in field_to_cell_mapping:
            cell_address = field_to_cell_mapping[field_path]
            cell_values[cell_address] = value
            mapped_count += 1
            
        else:
            # Track unmapped fields that have values
            if value not in ("", None):
                unmapped_with_values.append((field_path, value))
    
    # ============================================================
    # CALCULATED FIELDS
    # ============================================================
    log_info("\n--- Calculating Derived Fields ---")
    
    # Calculate Net Worth = Share Capital + Reserves & Surplus
    share_capital_field = "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital"
    reserves_surplus_field = "balanceSheet.equityAndLiabilities.shareHoldersFund.reservesAndSurplus"
    net_worth_field = "financialParameters.netWorthOfCompany"
    
    share_capital = extracted_values.get(share_capital_field, 0)
    reserves_surplus = extracted_values.get(reserves_surplus_field, 0)
    log_info(f"    Share Capital: {share_capital}")
    log_info(f"    Reserves & Surplus: {reserves_surplus}")
    
    # Convert to numeric, handle empty strings (but keep negatives!)
    if share_capital in ("", None):
        share_capital = 0
    else:
        share_capital = float(share_capital)
    
    if reserves_surplus in ("", None):
        reserves_surplus = 0
    else:
        reserves_surplus = float(reserves_surplus)
    
    net_worth = share_capital + reserves_surplus
    
    log_info(f"  Net Worth Calculation:")
    log_info(f"    Share Capital: {share_capital}")
    log_info(f"    Reserves & Surplus: {reserves_surplus}")
    log_info(f"    Net Worth: {net_worth}")
    
    # Map net worth to cell if mapping exists
    if net_worth_field in field_to_cell_mapping:
        net_worth_cell = field_to_cell_mapping[net_worth_field]
        cell_values[net_worth_cell] = round(net_worth, 2)
        log_info(f"  {net_worth_cell} ← {net_worth_field} = {round(net_worth, 2)} (calculated)")
        mapped_count += 1
    else:
        log_info(f"  ⚠ No mapping found for {net_worth_field}")
    
    # ============================================================
    
    # Summary
    log_info(f"\n{'='*80}")
    log_info(f"✓ PASS 3 COMPLETE: COMBINATION")
    log_info(f"{'='*80}")
    log_info(f"Total fields processed: {len(extracted_values)}")
    log_info(f"Fields with values: {value_count}")
    log_info(f"Successfully mapped to cells: {mapped_count}")
    log_info(f"Total cells filled: {len(cell_values)}")
    
    # Show cells with non-zero values
    non_zero_cells = {k: v for k, v in cell_values.items() if v not in ("", None)}
    log_info(f"Cells with non-zero values: {len(non_zero_cells)}")
    
    # Warn about unmapped fields with values
    if unmapped_with_values:
        log_info(f"\n⚠ WARNING: {len(unmapped_with_values)} fields have values but no cell mapping:")
        for field, value in unmapped_with_values[:10]:
            log_info(f"  - {field}: {value}")
        if len(unmapped_with_values) > 10:
            log_info(f"  ... and {len(unmapped_with_values) - 10} more")
    
    return cell_values


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def extract_aoc4_fields_with_bedrock(document_text: str, template_data: dict) -> Dict[str, Any]:
    """
    Main entry point for AOC-4 extraction
    
    Args:
        document_text: Extracted text from AOC-4 PDF
        template_data: Excel template structure {cell: [value, is_protected]}
    
    Returns:
        Dict of {cell_address: value} ready to fill into Excel
    """
    log_info("\n" + "=" * 80)
    log_info("AOC-4 COMPLETE EXTRACTION SYSTEM")
    log_info("=" * 80)
    
    # PASS 1: Extract values from document (AI, per document)
    extracted_values = extract_field_values_from_document(document_text)
    
    # PASS 2: Get field-to-cell mapping from template (cached, one-time)
    field_to_cell_mapping = generate_field_to_cell_mapping(template_data)
    
    # PASS 3: Combine both (no AI, instant)
    cell_values = combine_values_and_mapping(extracted_values, field_to_cell_mapping)
    
    log_info("\n" + "=" * 80)
    log_info("✓ EXTRACTION COMPLETE")
    log_info("=" * 80)
    
    return cell_values