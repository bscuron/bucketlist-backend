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

Follow these steps to run the project as your own.

### Step 1: Install dependencies

- [Node.js](https://nodejs.org/en/download)
- [npm](https://nodejs.org/en/download) (Installed with Node.js)

### Step 2: Clone the repository

```sh
git clone https://github.com/bscuron/bucketlist-backend.git
```

### Step 3: Make necessary changes

Our application is currently hosted at [https://cis-linux2.temple.edu](https://cis-linux2.temple.edu). In order to transfer the application to your domain, you will need to replace all instances of `cis-linux2.temple.edu` with your own domain. To accomplish this task, you can utilize the powerful tool [sed](https://man7.org/linux/man-pages/man1/sed.1.html) that can replace the old domain with your new one throughout your project.

You must also setup your MySQL database with our [schema](https://github.com/bscuron/bucketlist-backend/blob/master/SCHEMA.sql). Please use the following command

```sh
mysql -u username -p database_name < SCHEMA.sql
```

### Step 4: Install node modules

```sh
cd bucketlist-backend && npm install
```

### Step 5: Run the application

```sh
npm run start
```

You should now be setup to make requests to the backend application from the frontend using HTTP requests. Requests can be made to the application endpoints located in [index.js](https://github.com/bscuron/bucketlist-backend/blob/master/src/index.ts).

## Uninstall

### Step 1: Stop the server

If the application is currently running on your server, make sure to stop it.

### Step 2: Delete the project folder

You can simply delete the project folder where you cloned the repository. If you are using a Unix-like operating system, you can use the following command to delete the project folder:

```sh
rm -rf bucketlist-backend
```

This will delete the entire `bucketlist-backend` folder and its contents, including the `package.json` file and all installed dependencies.
