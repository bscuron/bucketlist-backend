# Bucketlist Backend

Demo: [https://cis-linux2.temple.edu/bucketlist](https://cis-linux2.temple.edu/bucketlist)

<p align="center">
  <img width="30%" src="./assets/AppIconbucketList.png" alt="alt text">
</p>

## Welcome to Bucketlist!

Check off and complete your wish list with friends, and keep all your memory without regret.

Bucketlist provides the ability to create an interactive list of activities you may want to accomplish. With this list, you can connect with old and new friends to complete these activities and live a more fulfilled life. Many times, we want to do things but never do them. Bucketlist is intended to get people out and to accomplish their goals. With the help of social connection and common interests, users can connect and live the life they want to live instead of daydreaming but never doing.

Through social connection and event tracking and planning we can all reach our goals. Not only will your upcoming events be available on your bucket list, you can also view your friends upcoming events too! We hope you can check off your list and try fun activities you might not have thought about!

## Install
### Step 1: Install dependencies

1. [Node.js](https://nodejs.org/en/download) >= 16.19.0
2. Run:

```sh
npm install
npm run serve
```
```
# Update package lists
sudo apt-get update

# Install Node.js and npm
sudo apt-get install nodejs npm
```
### Step 2: Clone the repository

```
# Clone the repository
git clone https://github.com/bscuron/bucketlist-backend.git
```

### Step 3: Install dependencies

```
# Change directory to the project folder
cd bucketlist-backend

# Install project dependencies
npm install
```

### Step 4: Run the project

```
# Start the project
npm run start
```

Using the start script specified in the scripts part of the package.json file, this will launch the Node.js backend server. On the specified port, the server will launch and begin to accept inbound requests.

Note: In order to successfully launch the backend server, please make sure you have the necessary dependencies (such as MySQL) properly installed and set, as specified in the dependencies section of the package.json file.


## Uninstall

### Step 1: Stop the server

If the server is currently running, you should stop it before proceeding with the uninstallation process.


### Step 2: Delete the project folder

You can simply delete the project folder where you cloned the repository. If you are using a Unix-like operating system, you can use the following command to delete the project folder:

```
rm -rf bucketlist-backend
```

This will delete the entire "bucketlist-backend" folder and its contents, including the `package.json` file and all installed dependencies.

### Step 3: Uninstall global dependencies (optional)

If you have installed any dependencies globally using npm, you can uninstall them if they are no longer needed. For example, if you have installed `typescript` or `typedoc` globally, you can uninstall them using the following commands:
```
npm uninstall -g typescript
npm uninstall -g typedoc
```
