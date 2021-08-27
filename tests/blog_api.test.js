const mongoose = require('mongoose')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Blog = require('../models/blog')


describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })
})

describe('blog api test', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })
  test('blogs are returned as json', async () => {
    await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
  }, 100000)

  test('there are 6 blogs', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('id is defined', async () => {
    const blogs = await helper.blogsInDb()
    expect(blogs[0].id).toBeDefined()
  })

  test('can post a new blog', async () => {
    const users = await User.find({})
    console.log("Users:  ", users)
    const user1 = users[0].toJSON()
    console.log("user1:  ", user1)
    const newEmptyBlog = {...helper.emptyBlog}
    console.log("newEmptyBlog:  ", newEmptyBlog)
    newEmptyBlog.user = user1.id
    await api
    .post('/api/blogs')
    .send(newEmptyBlog)
    .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(n => n.title)
    expect(titles).toContain(
      'willremovethissoon'
    )
  })

  test('likes defaults to 0', async () => {
    const { title, author, url } = helper.emptyBlog
    const response = await api
    .post('/api/blogs')
    .send({ title, author, url })
    const responseBlog = JSON.parse(response.text)
    expect(responseBlog.likes).toBe(0)

  })

  test('bad requests respond with status 400', async () => {
    const { author, likes } = helper.emptyBlog
    const testBlog = { author, likes }
    console.log('testBlog: ', testBlog)
    await api
    .post('/api/blogs')
    .send(testBlog)
    .expect(400)

    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

})

afterAll(() => {
  mongoose.connection.close()
})
