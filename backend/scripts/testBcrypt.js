import bcrypt from 'bcryptjs'

const password = 'password123'
const hash1 = bcrypt.hashSync(password, 10)
console.log('Hash1:', hash1)

const hash2 = bcrypt.hashSync(hash1, 10)
console.log('Hash2 (double hashed):', hash2)

console.log('Compare original with hash1:', bcrypt.compareSync(password, hash1))
console.log('Compare original with hash2:', bcrypt.compareSync(password, hash2))
