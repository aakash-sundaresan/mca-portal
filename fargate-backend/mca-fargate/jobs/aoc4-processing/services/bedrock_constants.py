"""
AOC-4 Predefined Fields Configuration

Contains all field definitions for AOC-4 document extraction.
"""

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
    "financialParameters.shareApplicationMoneyReceivedDuringReportingPeriod": {"type": "numeric", "default": 0},
    "financialParameters.shareApplicationMoneyReceivedAndDueForRefund": {"type": "numeric", "default": 0},
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
    "statementOfProfitAndLoss.expenses.totalExpenses": {"type": "numeric", "default": ""},
    
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
    "declaration.dated": {"type": "date", "default": ""},
}

# ============================================================================
# PROMPTS FOR BEDROCK EXTRACTION
# ============================================================================

EXTRACTION_PROMPT_TEMPLATE = """Extract financial data from this AOC-4 document chunk.

DOCUMENT CHUNK:
{chunk_text}

FIELD DEFINITIONS (extract values for any fields present in chunk):
{field_list}

EXTRACTION RULES:

🔍 SEMANTIC MATCHING:
- Field names in document may differ from field paths
- Match by MEANING and CONTEXT, not exact text
- Example: "shareCapital" matches "Share Capital", "Equity Share Capital", "Capital Stock"
- Example: "tradeReceivables" matches "Trade Receivables", "Sundry Debtors", "Accounts Receivable"
- Example: "rentPaid" matches "Rent", "Rent Paid", "Rent Expenses", "Office Rent", "Lease Rent", "Building Rent"

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

🎯 CRITICAL FIELDS (DO NOT MISS):

🎯 CRITICAL FIELDS (DO NOT MISS):

1. **EARNINGS PER SHARE (EPS)** - HIGHLY IMPORTANT:
   - Look for: "Earnings per Share", "EPS", "Basic EPS", "Diluted EPS"
   - Look for: "EPS before extraordinary items", "EPS after extraordinary items"
   - These may appear in notes, P&L statement, or separate EPS section
   - Extract ALL variants found
   - IMPORTANT: Extract BOTH basic AND diluted separately
   - Map to fields:
     * statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.basic
     * statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.diluted
     * statementOfProfitAndLoss.earningsPerEquityShareAfterExtraordinaryItems.basic
     * statementOfProfitAndLoss.earningsPerEquityShareAfterExtraordinaryItems.diluted
     * financialParameters.profitAndLossItems.earningsPerShare.basic
     * financialParameters.profitAndLossItems.earningsPerShare.diluted

2. **RENT PAID** - CRITICAL - DO NOT MISS:
   - This field is FREQUENTLY MISSED - pay extra attention
   - Look EVERYWHERE for: "Rent", "Rent Paid", "Rent Expense", "Office Rent", "Factory Rent", "Lease Rent", "Premises Rent", "Building Rent"
   - Check in:
     * Other Expenses breakdown
     * Notes to Accounts (especially Note on Other Expenses)
     * Expense schedules
     * Related Party Transactions (rent paid to related parties)
     * Schedule of expenses
   - Rent might be:
     * A separate line item in expenses
     * Part of "Other Expenses" with a breakup in notes
     * Mentioned in related party disclosures
   - SCAN CAREFULLY - this is often buried in notes or schedules
2.5 **EXTRACTION STRATEGY FOR RENT:**
   - Rent often appears in "Other Expenses" breakdown in NOTES section
   - Main P&L may show "Other Expenses: 651,753" but Note/Schedule breaks it down
   - Look for patterns: "Rent | 346,950" or "Building rent: 346,950"
   - If multiple rent types listed, sum them all
   - Map to: financialParameters.profitAndLossItems.rentPaid

3. **PAYMENT TO AUDITORS** - CRITICAL - DO NOT MISS:
   - This field is FREQUENTLY MISSED - pay extra attention
   - Look EVERYWHERE for: "Auditor", "Auditors' Remuneration", "Audit Fees", "Statutory Audit", "Payment to Auditors", "Auditor's Fees"
   - Check in:
     * Other Expenses breakdown
     * Notes to Accounts (especially Note on Other Expenses)
     * Expense schedules
     * Notes on auditor remuneration
   - May appear as:
     * "Statutory Audit fees"
     * "Auditors' remuneration"
     * "Audit fees"
     * Part of "Other Expenses" with detailed breakup in notes
   - SCAN CAREFULLY - this is often buried in notes or expense schedules

4. **TOTAL EXPENSES** - IMPORTANT FOR CALCULATION:
   - Extract "Total Expenses" value - this is needed for calculating Other Expenses
   - Look for: "Total Expenses", "Total Expenditure"
   - This value will NOT be filled in the template, only used for calculation

5. **AS-18 / RELATED PARTY TRANSACTIONS** - IMPORTANT:
   - AS-18 is the Indian Accounting Standard for Related Party Disclosures
   - Look for sections titled:
     * "Related Party Transactions"
     * "AS-18 Disclosures"
     * "Related Party Disclosures"
     * "Transactions with Related Parties"
     * "Disclosure as required under Accounting Standard-18"
   - Extract transactions with: Directors, Key Management Personnel, Subsidiaries, Associates, Fellow Subsidiaries
   - Common items: Remuneration, Loans, Purchases, Sales, Rent paid to related parties
   
   **CRITICAL EXTRACTION RULES FOR AS-18:**
   - Find the Related Party note (usually in Notes to Accounts section)
   - Look for tables showing: Party Name | Transaction Type | Amount
   - Extract ALL transaction amounts you see in that section
   - SUM all amounts together for gross value
   - Map to BOTH:
     * financialParameters.grossValueOfTransactionAsPerAS18
     * financialParameters.profitAndLossItems.grossValueOfTransactionWithRelatedPartiesAsPerAS18
   - If bad debts mentioned, map to: financialParameters.profitAndLossItems.badDebtsOfRelatedPartiesAsPerAS18

6. **MANAGERIAL REMUNERATION**:
   - Look for: "Managerial Remuneration", "Directors' Remuneration", "KMP Compensation"
   - This is separate from general Employee Benefits

7. **ENDOWMENT FUND**:
   - If you find "Endowment Fund" in the document, note its value
   - This needs to be ADDED to "Reserves and Surplus"

🔍 FINAL REMINDERS BEFORE EXTRACTION:
- NOTES sections contain detailed breakdowns - scan them thoroughly
- "Other Expenses" in main P&L is often broken down in a Note/Schedule - look for that breakdown
- AS-18/Related Party information is usually in a separate Note - find and read that entire note
- When you see transaction tables with party names and amounts, SUM ALL amounts for AS-18 gross value
- Don't skip over detailed schedules and notes - they contain the critical field values

OUTPUT:
Return ONLY valid JSON mapping field_path → extracted_value:
{{
  "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": 2500000.00,
  "balanceSheet.assets.Assets.tradeReceivables": 450000.00,
  "statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.basic": -2.82,
  "statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.diluted": -2.82,
  "statementOfProfitAndLoss.expenses.rentPaid": 50000.00,
  "statementOfProfitAndLoss.expenses.totalExpenses": 5000000.00,
  "notes.relatedPartyTransactions.totalTransactions": 100000.00,
  "statementOfProfitAndLoss.expenses.managerialRemuneration": 500000.00,
  "balanceSheet.equityAndLiabilities.shareHoldersFund.endowmentFund": 25000.00
  "financialParameters.profitAndLossItems.rentPaid": 346950.00,
  "financialParameters.grossValueOfTransactionAsPerAS18": 533813.00,
  "financialParameters.profitAndLossItems.grossValueOfTransactionWithRelatedPartiesAsPerAS18": 533813.00
}}

Only include fields found in this chunk. Return {{}} if no fields found.
No explanations. No markdown.
"""

CELL_MAPPING_PROMPT_TEMPLATE = """Map field definitions to Excel template cell addresses.

FIELD DEFINITIONS (find cell address for each):
{field_list}

TEMPLATE STRUCTURE (all rows with cells and values):
{template_structure}

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
   - "earningsPerEquityShare" matches "EPS", "Earnings per Share", "Basic EPS", "Diluted EPS"
   - "rentPaid" matches "Rent", "Rent Paid", "Rent Expenses", "Lease Rent", "Building Rent"
   - "relatedPartyTransactions" matches "AS-18", "Related Party Transactions", "RPT"
   - "dated" matches "Date", "Dated", "Date of Declaration"
   - Match by financial meaning, not exact text

6. SPECIAL INSTRUCTIONS:
   - DO NOT map "totalExpenses" - skip this field (it's used only for calculations)

7. VERIFICATION CHECKLIST (MUST VERIFY BEFORE RETURNING):
   ✓ Is is_protected = False for the cell I'm returning?
   ✓ Is the cell in the correct row (matching the field label)?
   ✓ Is it a data entry cell, NOT a label cell?
   ✓ Does the column position make sense?

OUTPUT FORMAT:
{{
  "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": "M201",
  "financialParameters.netWorthOfCompany": "M371",
  "statementOfProfitAndLoss.expenses.employeeBenefitExpenses": "N402",
  "statementOfProfitAndLoss.earningsPerEquityShare.basic": "M450",
  "statementOfProfitAndLoss.expenses.rentPaid": "M420",
  "declaration.dated": "M500"
}}

CRITICAL RULES:
- Return ONLY cells where is_protected = False
- NEVER EVER return cells where is_protected = True
- Return exact cell addresses (e.g., "M371", "AB45")
- Only map fields you can confidently locate
- Skip fields if uncertain
- DO NOT map "totalExpenses"
- Return {{}} if no confident mappings

Return ONLY valid JSON. No explanations. No markdown.
"""

