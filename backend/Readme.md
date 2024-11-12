install go 
install dependency: go mod tidy
go get github.com/dgrijalva/jwt-go

export JWT_SECRET_KEY=your_secret_key_here

go get github.com/rs/cors
