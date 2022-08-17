const axios = require('axios')
const sharp = require('sharp')

const tweet = async (twitterClient, twMsg, medias) => {
  const mediaIds = []
  await Promise.all(
    medias.map(async (media) => {
      const { mediaUrl } = media
      if (!mediaUrl) return
      try {
        const buffer = Buffer.from(
          await sharp(
            (
              await axios.get(mediaUrl, { responseType: 'arraybuffer' })
            ).data
          )
            .resize({
              width: 1000,
            })
            .webp()
            .toBuffer()
        )
        mediaIds.push({
          id: await twitterClient.v1.uploadMedia(buffer, { mimeType: 'webp' }),
          name: media.name,
        })
      } catch (e) {
        console.log(`❌ Failed to upload ${mediaUrl} to Twitter.`)
        console.log(e)
      }
    })
  )
  console.log('upload media done')

  const options = mediaIds.length
    ? { media: { media_ids: mediaIds.map((mId) => mId.id) } }
    : {}

  if (mediaIds.length)
    await Promise.all(
      mediaIds.map((mId) => {
        try {
          return twitterClient.v1.createMediaMetadata(mId.id, {
            alt_text: { text: mId.name },
          })
        } catch (e) {
          console.log(`❌ Failed to add metadata for image ${mId}.`)
          console.log(e)
        }
      })
    )
  console.log('media name done')

  try {
    const res = await twitterClient.v2.tweet(twMsg, options)
    console.log('✅ Successfully sent the following tweet:')
    console.log(res)
  } catch (e) {
    console.log(e)
  }
}

module.exports = tweet
