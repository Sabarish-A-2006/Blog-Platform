import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Post } from '../src/models/Post.js';
import { Comment } from '../src/models/Comment.js';

let mongo;
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Post.deleteMany({}), Comment.deleteMany({})]);
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

async function account(name, email) {
  const agent = request.agent(app);
  const csrf = await agent.get('/api/auth/csrf');
  const response = await agent.post('/api/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send({ name, email, password: 'strong-password-123', passwordConfirmation: 'strong-password-123' });
  return { agent, response, csrfToken: csrf.body.csrfToken };
}

const postDetails = (title = 'Learning to notice small things') => ({
  title,
  excerpt: 'A short note about learning to pay attention to the world around us.',
  content: 'Paying attention is a practice. The smallest details can open a door to a much larger idea, if we leave room to notice them.',
  category: 'Writing',
  tags: ['practice', 'ideas'],
  published: true
});

test('registers users, rejects duplicates, and sets an HttpOnly session cookie', async () => {
  const { agent, response, csrfToken } = await account('Avery Lane', 'avery@example.com');
  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, 'avery@example.com');
  assert.equal(response.body.user.passwordHash, undefined);
  assert.match(response.headers['set-cookie'].join(';'), /blogsphere_token=.*HttpOnly/i);
  const restored = await agent.get('/api/auth/me');
  assert.equal(restored.body.user._id, response.body.user._id);
  const publicProfile = await request(app).get(`/api/users/${response.body.user._id}`);
  assert.equal(publicProfile.status, 200);
  assert.equal(publicProfile.body.user.email, undefined);
  const duplicate = await agent.post('/api/auth/register').set('X-CSRF-Token', csrfToken).send({ name: 'Avery Lane', email: 'AVERY@example.com', password: 'strong-password-123', passwordConfirmation: 'strong-password-123' });
  assert.equal(duplicate.status, 409);
  const loginAgent = request.agent(app);
  const loginCsrf = await loginAgent.get('/api/auth/csrf');
  const login = await loginAgent.post('/api/auth/login').set('X-CSRF-Token', loginCsrf.body.csrfToken).send({ email: 'AVERY@example.com', password: 'strong-password-123' });
  assert.equal(login.status, 200);
  const logout = await loginAgent.post('/api/auth/logout').set('X-CSRF-Token', loginCsrf.body.csrfToken);
  assert.equal(logout.status, 200);
  assert.equal((await loginAgent.get('/api/auth/me')).body.user, null);
});

test('rejects invalid credentials and requests without a valid CSRF token', async () => {
  const csrfAgent = request.agent(app);
  const csrf = await csrfAgent.get('/api/auth/csrf');
  const invalid = await csrfAgent.post('/api/auth/login').set('X-CSRF-Token', csrf.body.csrfToken).send({ email: 'nobody@example.com', password: 'wrong-password' });
  assert.equal(invalid.status, 401);
  const invalidRegistration = await csrfAgent.post('/api/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send({ name: 'A', email: 'not-an-email', password: 'short', passwordConfirmation: 'different' });
  assert.equal(invalidRegistration.status, 400);
  assert.ok(invalidRegistration.body.errors.email);
  const protectedWrite = await csrfAgent.post('/api/posts').set('X-CSRF-Token', csrf.body.csrfToken).send(postDetails());
  assert.equal(protectedWrite.status, 401);
  const noCsrf = await request(app).post('/api/auth/register').send({ name: 'No Token', email: 'no@example.com', password: 'strong-password-123', passwordConfirmation: 'strong-password-123' });
  assert.equal(noCsrf.status, 403);
});

test('persists posts and comments, enforces ownership, and cascades comments on post deletion', async () => {
  const owner = await account('Post Owner', 'owner@example.com');
  assert.equal(owner.response.status, 201);
  const visitor = await account('Another Writer', 'writer@example.com');
  const outsider = await account('Outside Reader', 'outsider@example.com');
  const created = await owner.agent.post('/api/posts').set('X-CSRF-Token', owner.csrfToken).send(postDetails());
  assert.equal(created.status, 201);
  const postId = created.body.post._id;
  const updatedPost = await owner.agent.put(`/api/posts/${postId}`).set('X-CSRF-Token', owner.csrfToken).send(postDetails('Learning to notice even more small things'));
  assert.equal(updatedPost.status, 200);
  assert.equal(updatedPost.body.post.title, 'Learning to notice even more small things');
  const comment = await visitor.agent.post(`/api/posts/${postId}/comments`).set('X-CSRF-Token', visitor.csrfToken).send({ content: 'This gave me a new way to think about it.' });
  assert.equal(comment.status, 201);
  assert.equal(comment.body.total, 1);
  const editedComment = await visitor.agent.put(`/api/comments/${comment.body.comment._id}`).set('X-CSRF-Token', visitor.csrfToken).send({ content: 'This gave me a clearer way to think about it.' });
  assert.equal(editedComment.status, 200);
  assert.equal(editedComment.body.comment.content, 'This gave me a clearer way to think about it.');
  const forbiddenUpdate = await visitor.agent.put(`/api/posts/${postId}`).set('X-CSRF-Token', visitor.csrfToken).send(postDetails('Trying to take over this post'));
  assert.equal(forbiddenUpdate.status, 403);
  const forbiddenDelete = await visitor.agent.delete(`/api/posts/${postId}`).set('X-CSRF-Token', visitor.csrfToken);
  assert.equal(forbiddenDelete.status, 403);
  const forbiddenCommentUpdate = await outsider.agent.put(`/api/comments/${comment.body.comment._id}`).set('X-CSRF-Token', outsider.csrfToken).send({ content: 'An outsider cannot change this response.' });
  assert.equal(forbiddenCommentUpdate.status, 403);
  const forbiddenCommentDelete = await outsider.agent.delete(`/api/comments/${comment.body.comment._id}`).set('X-CSRF-Token', outsider.csrfToken);
  assert.equal(forbiddenCommentDelete.status, 403);
  const anotherCsrf = await owner.agent.get('/api/auth/csrf');
  const forbiddenCommentEdit = await owner.agent.put(`/api/comments/${comment.body.comment._id}`).set('X-CSRF-Token', anotherCsrf.body.csrfToken).send({ content: 'Changing someone else’s response is not allowed.' });
  assert.equal(forbiddenCommentEdit.status, 403);
  const moderated = await owner.agent.delete(`/api/comments/${comment.body.comment._id}`).set('X-CSRF-Token', anotherCsrf.body.csrfToken);
  assert.equal(moderated.status, 200);
  assert.equal(moderated.body.total, 0);
  const ownComment = await visitor.agent.post(`/api/posts/${postId}/comments`).set('X-CSRF-Token', visitor.csrfToken).send({ content: 'A second response for cascade cleanup.' });
  const ownDelete = await visitor.agent.delete(`/api/comments/${ownComment.body.comment._id}`).set('X-CSRF-Token', visitor.csrfToken);
  assert.equal(ownDelete.status, 200);
  const cascadeComment = await visitor.agent.post(`/api/posts/${postId}/comments`).set('X-CSRF-Token', visitor.csrfToken).send({ content: 'A final response for cascade cleanup.' });
  assert.equal(cascadeComment.status, 201);
  const deletePost = await owner.agent.delete(`/api/posts/${postId}`).set('X-CSRF-Token', anotherCsrf.body.csrfToken);
  assert.equal(deletePost.status, 200);
  assert.equal(await Comment.countDocuments({ post: postId }), 0);
});

test('searches published stories and paginates results', async () => {
  const { agent, csrfToken, response } = await account('Reader Writer', 'search@example.com');
  assert.equal(response.status, 201);
  await agent.post('/api/posts').set('X-CSRF-Token', csrfToken).send(postDetails());
  await agent.post('/api/posts').set('X-CSRF-Token', csrfToken).send(postDetails('A walk through a quiet garden'));
  const search = await request(app).get('/api/posts').query({ q: 'small things', page: 1, limit: 1 });
  assert.equal(search.status, 200);
  assert.equal(search.body.posts.length, 1);
  assert.equal(search.body.pagination.total, 1);
  const firstPage = await request(app).get('/api/posts').query({ page: 1, limit: 1 });
  assert.equal(firstPage.body.posts.length, 1);
  assert.equal(firstPage.body.pagination.pages, 2);
});
