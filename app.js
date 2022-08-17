const ethers = require('ethers')
const ensMapperAbi = require('./ensMapperAbi.json')
const { TwitterApi } = require('twitter-api-v2')
const tweet = require('./tweet')
require('dotenv').config()

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
})
const provider = new ethers.providers.AlchemyProvider(
  process.env.BLOCKCHAIN_NETWORK,
  process.env.RPC_API_KEY
)
const contractAddr = process.env.ENS_MAPPER_CONTRACT
const contract = new ethers.Contract(contractAddr, ensMapperAbi, provider)

async function pccEnsBot() {
  contract.on('RegisterSubdomain', (registrar, token_id, label, event) => {
    const eventData = {
      registrar: registrar,
      token_id: token_id,
      label: label,
      data: event,
    }
    // check if tx is to the contract directly, if not, skip
    if (contractAddr.toLowerCase() !== eventData.data.address.toLowerCase()) {
      return
    }
    console.log('^^meow~ 😺 in coming~')
    // use txData from transaction
    ;(async () => {
      const txData = await getTxData(eventData.data.transactionHash)
      const interface = new ethers.utils.Interface(ensMapperAbi)
      const decoded = interface.decodeFunctionData('setDomain', txData.data)
      const label = decoded[0].toLowerCase()
      const tokenId = ethers.BigNumber.from(decoded[1]).toString()
      const medias = [
        {
          mediaUrl: useImgUrl(tokenId),
          name: 'Cat#' + tokenId + ' ' + label + '.pcc.eth',
        },
      ]
      const twMsg = useTweetTemplate(
        tweetTemplate,
        label,
        tokenId,
        eventData.data.transactionHash
      )
      const args = [twitterClient, twMsg, medias]
      tweet(...args)
    })()
  })
}
console.log('✅ up')
pccEnsBot()

const getTxData = async (tx) => {
  try {
    return await provider.getTransaction(tx)
  } catch (err) {
    console.log(err)
  }
}

const useTweetTemplate = (tweetTemplate, label, tokenId, txHash) =>
  tweetTemplate
    .replace('$$LABEL$$', label)
    .replace('$$ID$$', tokenId)
    .replace('$$TX_HASH$$', txHash)
    .replace('$$PROFILE_LINK$$', 'https://pcc.im/' + label)

const tweetTemplate = `🎉 @PurrnelopesCC 😺 Cat#$$ID$$ just got its ENS name: $$LABEL$$.pcc.eth
See ENS purrfile 👉 $$PROFILE_LINK$$`

const imgUrlTemplate =
  'https://raw.githubusercontent.com/CuratorCat/pcc-cats-jpg/main/w1000/$$ID$$.jpg'
const useImgUrl = (tokenId) => {
  return imgUrlTemplate.replace('$$ID$$', tokenId)
}
