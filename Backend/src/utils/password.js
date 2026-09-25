import bcrypt from 'bcryptjs'

const HASH_ROUNDS = 12

export const hashPassword = (password) => bcrypt.hash(password, HASH_ROUNDS)
export const comparePassword = (password, hash) => bcrypt.compare(password, hash)
