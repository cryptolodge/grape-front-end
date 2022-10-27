import chevronDown from '../../assets/img/chevrondown.png';
import React, {useEffect, useMemo, useState} from 'react';
import {Box, Grid, Accordion, AccordionDetails, AccordionSummary, Slider, useMediaQuery} from '@material-ui/core';
import useEarnings from '../../hooks/useEarnings';
import useHarvest from '../../hooks/useHarvest';
import {getDisplayBalance, getFullDisplayBalance} from '../../utils/formatBalance';
import useTokenBalance from '../../hooks/useTokenBalance';
import useStakedBalance from '../../hooks/useStakedBalance';
import useStakedTokenPriceInDollars from '../../hooks/useStakedTokenPriceInDollars';
import useStake from '../../hooks/useStake';
import useZap from '../../hooks/useZap';
import useWithdraw from '../../hooks/useWithdraw';
import ZapModal from '../Bank/components/ZapModal';
import grapeFinance, {Bank} from '../../grape-finance';
import useStatsForPool from '../../hooks/useStatsForPool';
import TokenSymbol from '../../components/TokenSymbol';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useGrapeStats from '../../hooks/useGrapeStats';
import useShareStats from '../../hooks/useWineStats';
import useModal from '../../hooks/useModal';
import useApprove, {ApprovalState} from '../../hooks/useApprove';

interface FarmCardProps {
  bank: Bank;
  activesOnly: boolean;
}

const FarmCard: React.FC<FarmCardProps> = ({bank, activesOnly}) => {
  const widthUnder960 = useMediaQuery('(max-width:960px)');
  const poolStats = useStatsForPool(bank);

  const [activeDetailsBoxTab, setActiveDetailsBoxTab] = useState('Deposit');
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState<string>();

  const grapeStats = useGrapeStats();
  const tShareStats = useShareStats();
  const tokenBalance = useTokenBalance(bank.depositToken);
  const earnings = useEarnings(bank.contract, bank.earnTokenName, bank.poolId);
  const tokenStats = bank.earnTokenName === 'WINE' ? tShareStats : grapeStats;
  const stakedBalance = useStakedBalance(bank.contract, bank.poolId);
  const stakedTokenPriceInDollars = useStakedTokenPriceInDollars(bank.depositTokenName, bank.depositToken);
  const rewardTokenpriceInDollars = useStakedTokenPriceInDollars(bank.earnTokenName, bank.earnToken);
  const [approveStatus, approve] = useApprove(bank.depositToken, bank.address);

  const tokenPriceInDollars = useMemo(
    () => (tokenStats ? Number(tokenStats.priceInDollars).toFixed(2) : null),
    [tokenStats],
  );

  // Used in UI
  const earnedInToken = Number(getDisplayBalance(earnings));
  const earnedInDollars = (Number(tokenPriceInDollars) * earnedInToken).toFixed(2);
  const stakedInToken = Number(getDisplayBalance(stakedBalance, bank.depositToken.decimal));
  const stakedInDollars = (Number(stakedTokenPriceInDollars) * stakedInToken).toFixed(2);
  const rewardsPerDay = useMemo(
    () =>
      stakedInDollars && poolStats && rewardTokenpriceInDollars
        ? (Number(stakedInDollars) * (Number(poolStats.dailyAPR) / 100)) / Number(rewardTokenpriceInDollars)
        : null,
    [stakedInDollars, poolStats, rewardTokenpriceInDollars],
  );

  // Custom Hooks functinos
  const {onReward} = useHarvest(bank);
  const {onStake} = useStake(bank);
  const {onZap} = useZap(bank);
  const {onWithdraw} = useWithdraw(bank);

  // Custom functions
  const expand = () => {
    setExpanded(!expanded);
  };

  const withdraw = () => {
    if (Number(inputValue) > 0) {
      onWithdraw(inputValue.toString());
    }
  };
  const stake = () => {
    if (Number(inputValue) > 0) {
      onStake(inputValue.toString());
    }
  };

  const maxClicked = () => {
    if (activeDetailsBoxTab === 'Deposit') {
      setInputValue(getFullDisplayBalance(tokenBalance, 18));
    } else if (activeDetailsBoxTab === 'Withdraw') {
      setInputValue(stakedInToken.toString());
    }
  };

  const updateInput = (event: any) => {
    setInputValue(event.target.value);
  };

  const getLiquidityLink = () => {
    if (bank.depositTokenName === 'GRAPE-MIM-LP') {
      return 'https://traderjoexyz.com/pool/0x130966628846bfd36ff31a822705796e8cb8c18d/0x5541d83efad1f281571b343977648b75d95cdac2';
    } else if (bank.depositTokenName === 'GRAPE-MIM-SW') {
      return 'https://www.swapsicle.io/add/0x130966628846BFd36ff31a822705796e8cb8C18D/0x5541D83EFaD1f281571B343977648B75d95cdAC2';
    } else if (bank.depositTokenName.includes('WINE-MIM')) {
      return 'https://traderjoexyz.com/pool/0x130966628846bfd36ff31a822705796e8cb8c18d/0xc55036b5348cfb45a932481744645985010d3a44';
    } else if (bank.depositTokenName.includes('GRAPE-WINE')) {
      return 'https://traderjoexyz.com/pool/0x5541d83efad1f281571b343977648b75d95cdac2/0xc55036b5348cfb45a932481744645985010d3a44';
    } else if (bank.depositTokenName.includes('WINE-POPS')) {
      return 'https://www.swapsicle.io/add/0xC55036B5348CfB45a932481744645985010d3A44/0x240248628B7B6850352764C5dFa50D1592A033A8';
    }
  };

  const [onPresentZap, onDissmissZap] = useModal(
    <ZapModal
      decimals={bank.depositToken.decimal}
      onConfirm={(zappingToken, tokenName, amount) => {
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        onZap(zappingToken, tokenName, amount);
        onDissmissZap();
      }}
      LPtokenName={bank.depositTokenName}
    />,
  );

  const zap = () => {
    onPresentZap();
  };

  return (
    <>
      {(activesOnly === false || (activesOnly === true && stakedInToken > 0)) && (
        <Accordion expanded={expanded} onChange={expand} className="accordion">
          <AccordionSummary
            expandIcon={<ExpandMoreIcon style={{color: 'white'}} />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <Grid container justifyContent={'space-between'} alignItems="center" className="lineItemInner">
              <Grid item className="lineName" xs={12} sm={12} md={4}>
                <Grid container justifyContent="flex-start" alignItems="center" spacing={2} wrap="nowrap">
                  <Grid item>
                    <TokenSymbol symbol={bank.depositTokenName} height={30} width={30} />
                  </Grid>
                  <Grid item>
                    {bank.depositTokenName}
                    <br />
                    <span className="lineDescription">
                      Deposit {bank.depositTokenName} and earn {bank.earnTokenName}
                    </span>
                  </Grid>
                </Grid>
              </Grid>
              <Grid
                item
                xs={6}
                sm={3}
                md={2}
                style={{marginTop: widthUnder960 ? '15px' : '0', textAlign: widthUnder960 ? 'center' : 'left'}}
              >
                <div className="lineLabel">Deposited</div>
                <div className="lineValueDeposited">
                  <span style={{color: '#fcfcfc'}}>{stakedInToken}</span>
                  <span style={{marginLeft: '5px', fontSize: '14px'}}>(${stakedInDollars})</span>
                </div>
              </Grid>
              <Grid
                item
                xs={6}
                sm={3}
                md={2}
                style={{marginTop: widthUnder960 ? '15px' : '0', textAlign: widthUnder960 ? 'center' : 'left'}}
              >
                <div className="lineLabel">Rewards</div>
                <div className="lineValueDeposited">
                  <span style={{color: '#fcfcfc'}}>{earnedInToken}</span>
                  <span style={{marginLeft: '5px', fontSize: '14px'}}>(${earnedInDollars})</span>
                </div>
              </Grid>
              <Grid
                item
                xs={6}
                sm={3}
                md={2}
                style={{marginTop: widthUnder960 ? '15px' : '0', textAlign: widthUnder960 ? 'center' : 'left'}}
              >
                <div className="lineLabel">Daily APR</div>
                <div className="lineValue">{poolStats?.dailyAPR ? poolStats?.dailyAPR : '--.--'}%</div>
              </Grid>
              <Grid
                item
                xs={6}
                sm={3}
                md={2}
                style={{marginTop: widthUnder960 ? '15px' : '0', textAlign: widthUnder960 ? 'center' : 'left'}}
              >
                <div className="lineLabel">TVL</div>
                <div className="lineValue">
                  ${poolStats?.TVL ? Number(poolStats?.TVL).toLocaleString('en-US') : '--.--'}
                </div>
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={5}>
              <Grid item xs={12} sm={12} md={6}>
                <Box className="lineDetailsBox">
                  <div className="line-details-inner">
                    <Grid container justifyContent="space-evenly" spacing={2}>
                      <Grid
                        item
                        className={activeDetailsBoxTab === 'Deposit' ? 'tabDetailsItemActive' : 'tabDetailsItem'}
                        onClick={() => setActiveDetailsBoxTab('Deposit')}
                      >
                        DEPOSIT
                      </Grid>
                      <Grid
                        item
                        className={activeDetailsBoxTab === 'Withdraw' ? 'tabDetailsItemActive' : 'tabDetailsItem'}
                        onClick={() => setActiveDetailsBoxTab('Withdraw')}
                      >
                        WITHDRAW
                      </Grid>
                    </Grid>

                    <div className="inputDetailsBox">
                      <div className="balance">
                        {activeDetailsBoxTab === 'Deposit' && (
                          <span>
                            Balance: {getFullDisplayBalance(tokenBalance, 18)} {bank.depositTokenName}
                          </span>
                        )}
                        {activeDetailsBoxTab === 'Withdraw' && (
                          <span>
                            Staked: {stakedInToken} {bank.depositTokenName}
                          </span>
                        )}
                      </div>
                      <div className="inputDetailsBoxInner">
                        <Grid container justifyContent="space-between" alignItems="center" wrap="nowrap">
                          <Grid item xs={10} md={11}>
                            <input
                              type="number"
                              placeholder="Enter amount"
                              className="amount-input"
                              value={inputValue}
                              onChange={updateInput}
                            />
                          </Grid>
                          <Grid item xs={2} md={1} className="color-secondary">
                            <div onClick={maxClicked} className="max-button">
                              MAX
                            </div>
                          </Grid>
                        </Grid>
                      </div>
                    </div>
                    <Box mt={3}>
                      {getLiquidityLink() != null && (
                        <a
                          style={{textDecoration: 'none'}}
                          rel="noopener noreferrer"
                          target="_blank"
                          href={getLiquidityLink()}
                        >
                          <div className="addRemoveLiquidity color-secondary">Add / Remove Liquidity</div>
                        </a>
                      )}
                    </Box>
                  </div>

                  <Box>
                    <Grid container justifyContent="center">
                      {activeDetailsBoxTab === 'Deposit' && (
                        <>
                          {(bank.depositTokenName.includes('LP') || bank.depositTokenName === 'GRAPE-MIM-SW') && (
                            <Grid item xs={6}>
                              <button
                                onClick={zap}
                                className="secondary-button"
                                title="Zap"
                                style={{
                                  borderTopLeftRadius: '0',
                                  borderTopRightRadius: '0',
                                  borderBottomRightRadius: '0',
                                }}
                              >
                                Zap
                              </button>
                            </Grid>
                          )}
                          {activeDetailsBoxTab === 'Deposit' && (
                            <Grid item xs={6}>
                              {approveStatus !== ApprovalState.APPROVED ? (
                                <button
                                  style={{
                                    borderTopLeftRadius: '0',
                                    borderTopRightRadius: '0',
                                    borderBottomLeftRadius: '0',
                                  }}
                                  disabled={Number(inputValue) === 0}
                                  onClick={approve}
                                  className="primary-button"
                                  title="Approve"
                                >
                                  Approve
                                </button>
                              ) : (
                                <button
                                  style={{
                                    borderTopLeftRadius: '0',
                                    borderTopRightRadius: '0',
                                    borderBottomLeftRadius: '0',
                                  }}
                                  disabled={Number(inputValue) === 0}
                                  onClick={stake}
                                  className="primary-button"
                                  title="Deposit"
                                >
                                  Deposit
                                </button>
                              )}
                            </Grid>
                          )}
                        </>
                      )}

                      {activeDetailsBoxTab === 'Withdraw' && (
                        <>
                          <Grid item xs={12}>
                            {activeDetailsBoxTab === 'Withdraw' && (
                              <button
                                style={{borderTopLeftRadius: '0', borderTopRightRadius: '0'}}
                                disabled={Number(inputValue) === 0}
                                onClick={withdraw}
                                className="secondary-button"
                                title="Withdraw"
                              >
                                Withdraw
                              </button>
                            )}
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <Box className="lineDetailsBox">
                  <div className="line-details-inner">
                    <Box>
                      <div className="pending-rewards">PENDING {bank.earnTokenName} REWARDS</div>
                    </Box>
                    <Box style={{textAlign: 'center'}} mt={2}>
                      <TokenSymbol symbol={bank.earnTokenName} width={59} height={59} />
                    </Box>
                    <Box mt={2}>
                      <Grid
                        container
                        direction="column"
                        spacing={0}
                        justifyContent="center"
                        alignContent="center"
                        alignItems="center"
                      >
                        <Grid item className="rewardTokenAmount">
                          {earnedInToken} {bank.earnTokenName}
                        </Grid>
                        <Grid item className="rewardTokenValue">
                          ${earnedInDollars}
                        </Grid>
                      </Grid>
                    </Box>
                    <Box mt={2}>
                      <div className="rewards-per-day">
                        <span>
                          {rewardsPerDay?.toFixed(2)} {bank.earnTokenName} per day
                          <span style={{marginLeft: '5px', fontSize: '14px'}} className="rewardTokenValue">
                            ($
                            {(rewardsPerDay * Number(rewardTokenpriceInDollars)).toFixed(2)})
                          </span>
                        </span>
                      </div>
                    </Box>
                  </div>
                  <Box>
                    <Grid container justifyContent="center">
                      <Grid item xs={12}>
                        <button
                          className="primary-button"
                          title="Claim"
                          onClick={onReward}
                          disabled={earnings.eq(0)}
                          style={{borderTopLeftRadius: '0', borderTopRightRadius: '0'}}
                        >
                          CLAIM
                        </button>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </>
  );
};

export default FarmCard;