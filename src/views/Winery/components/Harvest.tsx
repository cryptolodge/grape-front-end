import React, {useMemo} from 'react';
import styled from 'styled-components';

import {Box, Button, Card, CardContent, Grid, Typography} from '@material-ui/core';

import TokenSymbol from '../../../components/TokenSymbol';
import Label from '../../../components/Label';
import Value from '../../../components/Value';
import CardIcon from '../../../components/CardIcon';
import useClaimRewardTimerBoardroom from '../../../hooks/boardroom/useClaimRewardTimerBoardroom';
import useClaimRewardCheck from '../../../hooks/boardroom/useClaimRewardCheck';
import ProgressCountdown from './ProgressCountdown';
import useHarvestFromBoardroom from '../../../hooks/useHarvestFromBoardroom';
import useEarningsOnBoardroom from '../../../hooks/useEarningsOnBoardroom';
import useGrapeStats from '../../../hooks/useGrapeStats';
import {getDisplayBalance} from '../../../utils/formatBalance';
import ReactTooltip from 'react-tooltip';
import rewards from '../../../assets/jsons/rewards.json';

const Harvest: React.FC = () => {
  const grapeStats = useGrapeStats();
  const {onReward} = useHarvestFromBoardroom();
  const earnings = useEarningsOnBoardroom();
  const canClaimReward = useClaimRewardCheck();

  const tokenPriceInDollars = useMemo(
    () => (grapeStats ? Number(grapeStats.priceInDollars).toFixed(2) : null),
    [grapeStats],
  );

  const earnedInDollars = (Number(tokenPriceInDollars) * Number(getDisplayBalance(earnings))).toFixed(2);

  const {from, to} = useClaimRewardTimerBoardroom();

  return (
    <Box>
      <Card>
        <CardContent>
          <StyledCardContentInner>
            <StyledCardHeader>
              <CardIcon>
                <TokenSymbol height={70} width={70} symbol="GRAPE" />
              </CardIcon>
              <Typography style={{textTransform: 'uppercase', color: '#930993'}}>
                <Value value={getDisplayBalance(earnings)} />
              </Typography>
              <Label text={`≈ $${Number(earnedInDollars).toLocaleString('en-US')}`} color="#fff" />
              <Label text="GRAPE Earned" color="#fff" />
            </StyledCardHeader>
            <StyledCardActions>
              <Grid container spacing={1}>
                <Grid item xs={10}>
                  <Button
                    onClick={onReward}
                    style={{width: '100%'}}
                    className={earnings.eq(0) || !canClaimReward ? 'shinyButtonDisabled' : 'shinyButton'}
                    disabled={earnings.eq(0) || !canClaimReward}
                  >
                    Claim
                  </Button>
                </Grid>
                <Grid item xs={2}>
                  <span
                    style={{
                      color: 'white',
                      display: 'block',
                      borderRadius: '4px',
                      height: '100%',
                      background: '#e647e6',
                      textAlign: 'center',
                      fontSize: '25px',
                      cursor: 'pointer',
                    }}
                    data-for="bank-tooltip"
                    data-tip={(rewards as any)["GRAPE"]}
                  >
                    ?
                  </span>
                  <ReactTooltip id="bank-tooltip" effect="solid" multiline />
                </Grid>
              </Grid>
            </StyledCardActions>
          </StyledCardContentInner>
        </CardContent>
      </Card>
      <Box mt={2} style={{color: '#FFF'}}>
        {canClaimReward ? (
          ''
        ) : (
          <Card>
            <CardContent>
              <Typography style={{textAlign: 'center'}}>Claim possible in</Typography>
              <ProgressCountdown hideBar={true} base={from} deadline={to} description="Claim available in" />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

const StyledCardHeader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`;
const StyledCardActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${(props) => props.theme.spacing[6]}px;
  width: 100%;
`;

const StyledCardContentInner = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`;

export default Harvest;
