import { ethers } from 'ethers'
import {
  ERC20_ABI,
  YCRV_TOKEN_ADDR,
  YFFI_POOL_1_ADDR,
  Y_STAKING_POOL_ABI,
} from '../../../../data/constants'
import { priceLookupService } from '../../../../services/price-lookup-service'
import { RiskLevel } from '../../../../types'
import { get_synth_weekly_rewards, toDollar, toFixed } from '../../../utils'

export default async function main(App) {
  const Y_STAKING_POOL = new ethers.Contract(
    YFFI_POOL_1_ADDR,
    Y_STAKING_POOL_ABI,
    App.provider
  )

  const Y_TOKEN = new ethers.Contract(YCRV_TOKEN_ADDR, ERC20_ABI, App.provider)

  const stakedYAmount =
    (await Y_STAKING_POOL.balanceOf(App.YOUR_ADDRESS)) / 1e18
  const earnedYFFI = (await Y_STAKING_POOL.earned(App.YOUR_ADDRESS)) / 1e18
  const totalStakedYAmount = (await Y_TOKEN.balanceOf(YFFI_POOL_1_ADDR)) / 1e18

  // Find out reward rate
  const weekly_reward = await get_synth_weekly_rewards(Y_STAKING_POOL)

  const rewardPerToken = weekly_reward / totalStakedYAmount

  const {
    'yffi-finance': YFFIPrice,
    'curve-fi-ydai-yusdc-yusdt-ytusd': YVirtualPrice,
  } = await priceLookupService.getPrices([
    'yffi-finance',
    'curve-fi-ydai-yusdc-yusdt-ytusd',
  ])

  const YFIWeeklyROI = (rewardPerToken * YFFIPrice * 100) / YVirtualPrice

  return {
    provider: 'yffi.finance',
    name: 'Curve-yCRV',
    poolRewards: ['YFFI', 'CRV'],
    risk: {
      smartContract: RiskLevel.LOW,
      impermanentLoss: RiskLevel.NONE,
    },
    apr: toFixed(YFIWeeklyROI * 52, 4),
    prices: [
      { label: 'YFFI', value: toDollar(YFFIPrice) },
      { label: 'yCRV', value: toDollar(YVirtualPrice) },
    ],
    staking: [
      {
        label: 'Pool Total',
        value: toDollar(totalStakedYAmount * YVirtualPrice),
      },
      {
        label: 'Your Total',
        value: toDollar(stakedYAmount * YVirtualPrice),
      },
    ],
    rewards: [
      {
        label: `${toFixed(earnedYFFI, 4)} YFFI`,
        value: toDollar(earnedYFFI * YFFIPrice),
      },
    ],
    ROIs: [
      {
        label: 'Hourly',
        value: `${toFixed(YFIWeeklyROI / 7 / 24, 4)}%`,
      },
      {
        label: 'Daily',
        value: `${toFixed(YFIWeeklyROI / 7, 4)}%`,
      },
      {
        label: 'Weekly',
        value: `${toFixed(YFIWeeklyROI, 4)}%`,
      },
    ],
    links: [
      {
        title: 'Instructions',
        link: 'https://boxmining.com/yffi-yield-farming/',
      },
      {
        title: 'Curve Pool',
        link: 'https://www.curve.fi/iearn/deposit',
      },
      {
        title: 'Staking',
        link: 'https://www.yffi.finance/#/stake',
      },
      {
        title: 'Token',
        link:
          'https://etherscan.io/address/0xCee1d3c3A02267e37E6B373060F79d5d7b9e1669',
      },
    ],
  }
}
