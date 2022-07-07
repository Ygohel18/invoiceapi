## API for Invoice app

## Steps

### 1) Import database file

### 2) Set environment variable

    Create .env file for localhost and put following values

    NODE_ENV={production|local}
    DB_HOST={localhost}
    DB_USER={username}
    B_PASSWORD={password}
    DB_DATABASE={database}
    SALT={yourpasswordkey}

### 3) Endpoints

    Register - http://yoursite/api/v1/register
    Login - http://yoursite/api/v1/login

### Implemented

    - Register
    - Login
