# NFT website template

This is a simple website template for getting NFT information directly from chain. It uses wallet (like metamask) to assure NFT connection.

## Configure

Update js/env.js file with you own addresses.

## Run locally

Serve root folder with any http server. For example, you can run node package http-server from root folder like this:

```sh
npx http-server
```

## Deploy to Apillon Hosting

To deploy your NFT website to Apillon Hosting you should:

1. Clone this repository and [configure](#configure) it to your needs.
2. If not already, register to [Apillon.io](https://app.apillon.io)
3. Log in to Apillon console and create new Hosting bucket inside your project.
4. In settings, create an API KEY with storage permissions. Write down API key and API secret.
5. In your github repository setup actions secrets (variables)
    * WEBSITE_UUID : copy UUID from hosting bucket on Appilon dashboard
    * APILLON_API_KEY : your previously created API key
    * APILLON_API_SECRET : your previously created API secret

Now everything should be ready. When you will push to master branch, your website should start deploy to Apillon IPFS hosting. Monitor progress on [Apillon.io](https://app.apillon.io) dashboard. After some time you'll be able to get IPNS url and also setup your own domain.

You can change behavior of the automatic deployment by editing [/.github/workflows/deploy.yml](/.github/workflows/deploy.yml).
