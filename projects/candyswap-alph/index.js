const {get} = require("../helper/http");
const alephium = require("../helper/chain/alephium");

async function getTvl(api) {
	const result = await get('https://candyswap.gg/api/token-list')

    const tokenPairs = (result
        .filter(listing => listing.arbitrageEnabled)
        .map(listing => listing.tokenPairs ?? []) ?? [])
        .flat()

    const seenIds = new Set()
    const uniqueTokenPairs = tokenPairs.filter(tokenPair => {
        if (seenIds.has(tokenPair.id)) return false
        seenIds.add(tokenPair.id)
        return true
    })

    const tokenPairTvls = {}
    for (let tokenPair of uniqueTokenPairs) {
        const firstTokenTvl = tokenPair?.firstTokenTvl ?? 0
        const secondTokenTvl = tokenPair?.secondTokenTvl ?? 0
        if (tokenPairTvls[tokenPair.firstTokenId] === undefined) {
            tokenPairTvls[tokenPair.firstTokenId] = 0n
        }
        if (tokenPairTvls[tokenPair.secondTokenId] === undefined) {
            tokenPairTvls[tokenPair.secondTokenId] = 0n
        }
        tokenPairTvls[tokenPair.firstTokenId] += BigInt(firstTokenTvl)
        tokenPairTvls[tokenPair.secondTokenId] += BigInt(secondTokenTvl)
    }

    for (let tokenPairTvl of Object.entries(tokenPairTvls)) {
        const tokenAddress = tokenPairTvl[0]
        const tvl = tokenPairTvl[1]
        api.add(alephium.contractIdFromAddress(tokenAddress), tvl)
    }
}

module.exports = {
	timetravel: false,
	methodology:
		"Total value of tokens provided as liquidity on alephium",
	alephium: { tvl: getTvl },
};